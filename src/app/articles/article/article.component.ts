import { Component, Input, OnInit, inject, effect } from '@angular/core';
import { ArticlesService } from '../services/articles.service';
import { DatePipe } from '@angular/common';
import { FormatParagraphsPipe } from '../../format-paragraphs.pipe';
import { DefaultImageDirective } from '../../shared/directives/default-image.directive';
import { LikeService } from '../services/like.service';

@Component({
  selector: 'app-article',
  imports: [DatePipe, FormatParagraphsPipe, DefaultImageDirective],
  templateUrl: './article.component.html'
})
export class ArticleComponent implements OnInit {
  @Input() articleId!: number;
  private articlesService = inject(ArticlesService);
  private likeService = inject(LikeService);
  
  article = this.articlesService.singleArticleSignal;
  articleImages = this.articlesService.articleImagesSignal;
  articleAuthor = this.articlesService.articleAuthorMapSignal;
  loading = this.articlesService.loading;

  isLiked = false;
  likes = 0;
  currentImageIndex = 0;
  imagesLoaded = false;

  constructor() {
    effect(() => {
      const images = this.articleImages().get(this.articleId);
      this.imagesLoaded = !!images && images.length > 0;
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
}