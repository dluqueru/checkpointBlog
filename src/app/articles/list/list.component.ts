import { Component, inject, OnInit, HostListener } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { DefaultImageDirective } from '../../shared/directives/default-image.directive';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ArticlesService } from '../services/articles.service';
import { CategoriesService } from '../services/categories.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [DatePipe, DefaultImageDirective, CommonModule, FormsModule, RouterLink],
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  articlesService = inject(ArticlesService);
  categoriesService = inject(CategoriesService);
  route = inject(ActivatedRoute);
  imagesMap = this.articlesService.articleImages;

  categories: { id: number, name: string }[] = [];
  selectedCategoryId: number | null = null;
  selectedSort = 'newest';
  searchQuery = '';

  ngOnInit(): void {
    this.loadCategories();
    this.setupSearchListener();
    this.loadInitialArticles();
  }

  private loadInitialArticles(): void {
      this.articlesService.getArticles(true).subscribe({
          error: () => {
              this.articlesService.articles.set([]);
          }
      });
  }

  private setupSearchListener(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      if (this.searchQuery) {
        this.articlesService.searchArticlesByTitle(this.searchQuery).subscribe({
          next: articles => {
            this.articlesService.articles.set(articles);
            if (articles.length > 0) {
              forkJoin([
                this.articlesService.loadImagesForArticles(articles),
                this.articlesService.loadAuthorsForArticles(articles)
              ]).subscribe();
            }
          },
          error: error => console.error('Error en la búsqueda:', error)
        });
      } else {
        this.articlesService.getArticles(true).subscribe();
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (this.isNearBottom() && !this.articlesService.loading()) {
      this.loadMoreArticles();
    }
  }

  private isNearBottom(): boolean {
    const threshold = 200;
    const position = window.scrollY + window.innerHeight;
    const height = document.body.scrollHeight;
    return position > height - threshold;
  }

  private loadMoreArticles(): void {
    if (!this.searchQuery && this.selectedCategoryId === null) {
      this.articlesService.getArticles().subscribe();
    }
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

  getMainImageForArticle(articleId: number): string | undefined {
    const images = this.imagesMap().get(articleId);
    return images?.[0]?.imageUrl;
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

    if (this.searchQuery) {
      const searchTerm = this.searchQuery.toLowerCase();
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(searchTerm)
      );
    }

    switch (this.selectedSort) {
      case 'oldest':
        return [...articles].sort((a, b) => 
          new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime());
      case 'views_asc':
        return [...articles].sort((a, b) => (a.views || 0) - (b.views || 0));
      case 'views_desc':
        return [...articles].sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'newest':
      default:
        return [...articles].sort((a, b) => 
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    }
  }

  clearFilters() {
    this.selectedCategoryId = null;
    this.selectedSort = 'newest';
    this.searchQuery = '';
    this.onCategorySelected();
  }
}