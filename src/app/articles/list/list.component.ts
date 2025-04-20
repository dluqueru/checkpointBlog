import { Component, inject } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ArticlesService } from '../services/articles.service';
import { CommonModule, DatePipe } from '@angular/common';
import { DefaultImageDirective } from '../../shared/directives/default-image.directive';

@Component({
  selector: 'app-list',
  imports: [SidebarComponent, DatePipe, DefaultImageDirective, CommonModule],
  templateUrl: './list.component.html'
})
export class ListComponent {

  articlesService: ArticlesService = inject(ArticlesService);
  imagesMap = this.articlesService.articleMainImages;

  ngOnInit(): void {
    this.articlesService.getArticles();
  }

  getImageForArticle(articleId: number): string | undefined {
    const map = this.imagesMap();
    return map.get(articleId)?.imageUrl;
  }

  getAuthorAvatar(username: string): string | undefined {
    const map = this.articlesService.articleAuthor();
    return map.get(username)?.photo;
  }
}
