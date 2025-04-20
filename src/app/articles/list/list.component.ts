import { Component, inject, NgModule } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ArticlesService } from '../services/articles.service';
import { CategoriesService } from '../services/categories.service';
import { CommonModule, DatePipe } from '@angular/common';
import { DefaultImageDirective } from '../../shared/directives/default-image.directive';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-list',
  imports: [SidebarComponent, DatePipe, DefaultImageDirective, CommonModule, FormsModule],
  templateUrl: './list.component.html'
})
export class ListComponent {

  articlesService: ArticlesService = inject(ArticlesService);
  categoriesService: CategoriesService = inject(CategoriesService);
  imagesMap = this.articlesService.articleMainImages;

  categories: { id: number, name: string }[] = [];
  selectedCategoryId: number | null = null;

  ngOnInit(): void {
    this.loadCategories();
    this.articlesService.getArticles();
  }

  loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: data => this.categories = data,
      error: err => console.error('Error al cargar categorías', err)
    });
  }

  onCategorySelected(): void {
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

  get filteredArticles() {
    if (this.selectedCategoryId === null) {
      return this.articlesService.articles();
    }

    return this.articlesService.articles().filter(article =>
      article.categories.some(category => category.categoryId === this.selectedCategoryId)
    );
  }
}