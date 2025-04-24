import { Component, inject, NgModule } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ArticlesService } from '../services/articles.service';
import { CategoriesService } from '../services/categories.service';
import { CommonModule, DatePipe } from '@angular/common';
import { DefaultImageDirective } from '../../shared/directives/default-image.directive';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-list',
  imports: [SidebarComponent, DatePipe, DefaultImageDirective, CommonModule, FormsModule, RouterLink],
  templateUrl: './list.component.html'
})
export class ListComponent {

  articlesService: ArticlesService = inject(ArticlesService);
  categoriesService: CategoriesService = inject(CategoriesService);
  imagesMap = this.articlesService.articleMainImages;

  categories: { id: number, name: string }[] = [];
  selectedCategoryId: number | null = null;
  selectedSort: string = 'newest';

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

  onSortChange(): void {
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
    let articles = this.articlesService.articles();

    if (this.selectedCategoryId !== null) {
      articles = articles.filter(article =>
        article.categories.some(category => category.categoryId === this.selectedCategoryId)
      );
    }

    switch (this.selectedSort) {
      case 'oldest':
        return [...articles].sort((a, b) => 
          new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
        );
      case 'views_asc':
        return [...articles].sort((a, b) => (a.views || 0) - (b.views || 0));
      case 'views_desc':
        return [...articles].sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'newest':
      default:
        return [...articles].sort((a, b) => 
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
        );
    }
  }

  clearFilters() {
    this.selectedCategoryId = null;
    this.selectedSort = 'newest';
    this.onCategorySelected();
    this.onSortChange();
  }
}