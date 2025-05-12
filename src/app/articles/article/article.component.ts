import { Component, Input, OnInit, inject, effect } from '@angular/core';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { ArticlesService } from '../services/articles.service';
import { DatePipe } from '@angular/common';
import { FormatParagraphsPipe } from '../../format-paragraphs.pipe';
import { DefaultImageDirective } from '../../shared/directives/default-image.directive';

@Component({
  selector: 'app-article',
  imports: [DatePipe, FormatParagraphsPipe, DefaultImageDirective],
  templateUrl: './article.component.html'
})
export class ArticleComponent implements OnInit {
  @Input() articleId!: number;
  private articlesService = inject(ArticlesService);
  
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
        if (this.imagesLoaded) {
            console.log('Imágenes cargadas:', images);
        }
    });
  }

  ngOnInit(): void {
    if (this.articleId) {
      this.loadArticleData();
    } else {
      console.warn('No se ha recibido articleId para cargar el artículo.');
    }
  }

  private loadArticleData(): void {
    this.articlesService.getArticleById(this.articleId);
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

  toggleLike(): void {
    this.isLiked = !this.isLiked;
    this.likes += this.isLiked ? 1 : -1;
  }
  
  getImageCount(): number {
    return this.articleImages().get(this.articleId)?.length || 0;
  }
}