import { Component, Input, OnInit, inject } from '@angular/core';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { ArticlesService } from '../services/articles.service';
import { DatePipe } from '@angular/common';
import { FormatParagraphsPipe } from '../../format-paragraphs.pipe';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [SidebarComponent, DatePipe, FormatParagraphsPipe],
  templateUrl: './article.component.html'
})
export class ArticleComponent implements OnInit {
  @Input() articleId!: number;
  private articlesService = inject(ArticlesService);
  
  article = this.articlesService.singleArticleSignal;
  articleMainImages = this.articlesService.articleMainImageSignal;
  articleAuthor = this.articlesService.articleAuthorMapSignal;
  imagesMap = this.articlesService.articleMainImages;

  isLiked = false;
  likes = 0;

  ngOnInit(): void {
    if (this.articleId) {
      this.articlesService.getArticleById(this.articleId);
    } else {
      console.warn('No se ha recibido articleId para cargar el artículo.');
    }
  }

  getAuthorAvatar(username?: string): string {
    if (!username) {
      return 'assets/images/avatarDefaultImage.jpg';
    }
  
    const photo = this.articlesService.articleAuthor().get(username)?.photo;
    return photo || 'assets/images/avatarDefaultImage.jpg';
  }

  getImageForArticle(articleId?: number): string {
    if (!articleId) {
      return 'assets/images/articleDefaultImage.jpg';
    }
  
    const map = this.imagesMap();
    return map.get(articleId)?.imageUrl || 'assets/images/articleDefaultImage.jpg';
  }

  toggleLike() {
    this.isLiked = !this.isLiked;
    this.likes += this.isLiked ? 1 : -1;
  }
  
}