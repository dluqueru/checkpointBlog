import { Component, Input, OnInit, inject } from '@angular/core';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { ArticlesService } from '../services/articles.service';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './article.component.html'
})
export class ArticleComponent implements OnInit {
  @Input() articleId!: number;
  private articlesService = inject(ArticlesService);
  
  article = this.articlesService.singleArticleSignal;
  articleMainImages = this.articlesService.articleMainImageSignal;
  articleAuthor = this.articlesService.articleAuthorMapSignal;

  ngOnInit(): void {
    if (this.articleId) {
      this.articlesService.getArticleById(this.articleId);
    } else {
      console.warn('No se ha recibido articleId para cargar el artículo.');
    }
  }
}