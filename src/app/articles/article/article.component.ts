import { Component, Input, OnInit, inject, effect } from '@angular/core';
import { ArticlesService } from '../services/articles.service';
import { DatePipe } from '@angular/common';
import { FormatParagraphsPipe } from '../../format-paragraphs.pipe';
import { DefaultImageDirective } from '../../shared/directives/default-image.directive';
import { LikeService } from '../services/like.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-article',
  imports: [DatePipe, FormatParagraphsPipe, DefaultImageDirective],
  templateUrl: './article.component.html'
})
export class ArticleComponent implements OnInit {
  @Input() articleId!: number;
  private articlesService = inject(ArticlesService);
  private likeService = inject(LikeService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  article = this.articlesService.singleArticleSignal;
  articleImages = this.articlesService.articleImagesSignal;
  articleAuthor = this.articlesService.articleAuthorMapSignal;
  loading = this.articlesService.loading;

  isLiked = false;
  likes = 0;
  currentImageIndex = 0;
  imagesLoaded = false;

  isReported = false;
  reportLoading = false;
  reportDisabled = false;
  unreportLoading = false;
  isAdmin = false;
  isAuthor = false;

  constructor() {
    effect(() => {
      const article = this.article();
      if (article) {
        this.isAuthor = this.authService.username === article.username;
      }

      const images = this.articleImages().get(this.articleId);
      this.imagesLoaded = !!images && images.length > 0;

      this.isReported = this.article()?.reported || false;
      this.reportDisabled = this.isReported;
      this.isAdmin = this.authService.isAdmin();
    });
  }

  ngOnInit(): void {
    if (this.articleId) {
      this.loadArticleData();
      this.loadLikeData();
    } else {
      console.warn('No se ha recibido articleId para cargar el artículo.');
    }
  }

  private loadArticleData(): void {
    this.articlesService.getArticleById(this.articleId);
  }

  private loadLikeData(): void {
    this.likeService.hasUserLiked(this.articleId).subscribe(hasLiked => {
      this.isLiked = hasLiked;
    });

    this.likeService.getLikeCount(this.articleId).subscribe(count => {
      this.likes = count;
    });
  }

  toggleLike(): void {
    this.likeService.toggleLike(this.articleId).subscribe({
      next: (response: any) => {
        this.isLiked = response.liked;
        this.likes = response.likeCount;

        if (this.isLiked) {
          this.animateLike();
        }
      },
      error: (err) => {
        console.error('Error al actualizar like:', err);
      }
    });
  }

  private animateLike(): void {
    const heartIcon = document.querySelector('.heart-icon');
    heartIcon?.classList.add('heart-animate');
    setTimeout(() => {
      heartIcon?.classList.remove('heart-animate');
    }, 1000);
  }

  getAuthorAvatar(username?: string): string {
    if (!username) return 'assets/images/avatarDefaultImage.jpg';
    return this.articleAuthor().get(username)?.photo || 'assets/images/avatarDefaultImage.jpg';
  }

  getCurrentImage(): string {
    const images = this.articleImages().get(this.articleId);
    if (!images || images.length === 0) {
        return 'assets/images/articleDefaultImage.jpg';
    }
    return images[this.currentImageIndex]?.imageUrl || 'assets/images/articleDefaultImage.jpg';
  }

  nextImage(): void {
    const images = this.articleImages().get(this.articleId) || [];
    this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
  }

  prevImage(): void {
    const images = this.articleImages().get(this.articleId) || [];
    this.currentImageIndex = (this.currentImageIndex - 1 + images.length) % images.length;
  }
  
  getImageCount(): number {
    return this.articleImages().get(this.articleId)?.length || 0;
  }

  reportArticle(): void {
    if (this.reportDisabled || this.reportLoading) return;
    
    this.reportLoading = true;
    
    this.articlesService.reportArticle(this.articleId).subscribe({
      next: (updatedArticle) => {
        this.isReported = true;
        this.reportDisabled = true;

        this.articlesService.singleArticleSignal.set(updatedArticle);
        
        Swal.fire({
          title: "Artículo reportado",
          text: "Hemos recibido tu reporte. Los administradores lo revisarán pronto.",
          icon: 'warning',
          iconColor: '#008B8B',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#008B8B',
          background: 'rgba(44, 44, 44, 0.95)',
          color: '#FFFFFF'
        });
      },
      error: (err) => {
        console.error('Error al reportar artículo:', err);
        
        Swal.fire({
          title: 'Error!',
          text: 'No se pudo reportar el artículo. Por favor inténtalo más tarde.',
          icon: 'error',
          iconColor: '#d32f2f',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#008B8B',
          background: 'rgba(44, 44, 44, 0.95)',
          color: '#FFFFFF'
        });
      },
      complete: () => {
        this.reportLoading = false;
      }
    });
  }

  unreportArticle(): void {
    if (!this.isAdmin || !this.article()?.reported) return;
    
    this.unreportLoading = true;
    
    this.articlesService.unreportArticle(this.articleId).subscribe({
      next: (updatedArticle) => {
        this.isReported = false;
        this.reportDisabled = false;

        this.articlesService.singleArticleSignal.set(updatedArticle);
        
        Swal.fire({
          title: "Artículo desreportado",
          text: "El artículo ha sido restaurado correctamente.",
          icon: 'success',
          iconColor: '#008B8B',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#008B8B',
          background: 'rgba(44, 44, 44, 0.95)',
          color: '#FFFFFF'
        });
      },
      error: (err) => {
        console.error('Error al desreportar artículo:', err);
        
        Swal.fire({
          title: 'Error!',
          text: 'No se pudo desreportar el artículo. Por favor inténtalo más tarde.',
          icon: 'error',
          iconColor: '#d32f2f',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#008B8B',
          background: 'rgba(44, 44, 44, 0.95)',
          color: '#FFFFFF'
        });
      },
      complete: () => {
        this.unreportLoading = false;
      }
    });
  }

  editArticle(): void {
    this.router.navigate(['/edit-article', this.articleId]);
  }

  deleteArticle(): void {
    Swal.fire({
      title: '¿Estás segur@?',
      text: "¡Una vez borrado no podrás recuperarlo!",
      icon: 'warning',
      iconColor: '#d32f2f',
      showCancelButton: true,
      confirmButtonColor: '#008B8B',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, borrarlo',
      cancelButtonText: 'Cancelar',
      background: 'rgba(44, 44, 44, 0.95)',
      color: '#FFFFFF'
    }).then((result) => {
      if (result.isConfirmed) {
        this.articlesService.deleteArticle(this.articleId).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Borrado!',
              text: 'El artículo ha sido eliminado correctamente.',
              icon: 'success',
              iconColor: '#008B8B',
              confirmButtonColor: '#008B8B',
              background: 'rgba(44, 44, 44, 0.95)',
              color: '#FFFFFF'
            });
            this.router.navigate(['/']);
          },
          error: (err) => {
            console.error('Error al borrar artículo:', err);
            Swal.fire({
              title: 'Error!',
              text: 'No se pudo borrar el artículo.',
              icon: 'error',
              iconColor: '#d32f2f',
              confirmButtonColor: '#008B8B',
              background: 'rgba(44, 44, 44, 0.95)',
              color: '#FFFFFF'
            });
          }
        });
      }
    });
  }
}