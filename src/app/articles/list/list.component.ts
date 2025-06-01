import { Component, inject, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { DefaultImageDirective } from '../../shared/directives/default-image.directive';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ArticlesService } from '../services/articles.service';
import { CategoriesService } from '../services/categories.service';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [DatePipe, DefaultImageDirective, CommonModule, FormsModule, RouterLink],
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  articlesService = inject(ArticlesService);
  categoriesService = inject(CategoriesService);
  authService = inject(AuthService);
  private router = inject(Router);
  route = inject(ActivatedRoute);
  imagesMap = this.articlesService.articleImages;

  categories: { id: number, name: string }[] = [];
  selectedCategoryId: number | null = null;
  selectedSort = 'newest';
  searchQuery = '';

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCategories();
    this.setupSearchListener();
    this.loadInitialArticles();
  }

  private loadInitialArticles(): void {
    this.articlesService.articles.set([]);
    this.articlesService.articleImages.set(new Map());
    this.articlesService.articleAuthor.set(new Map());
    
    this.articlesService.getArticles(true).subscribe({
        error: () => {
            this.articlesService.articles.set([]);
        }
    });
  }

  private setupSearchListener(): void {
    this.route.queryParams.subscribe(params => {
      const newSearchQuery = params['search'] || '';

      if (newSearchQuery !== this.searchQuery) {
        this.searchQuery = newSearchQuery;
        this.articlesService.loading.set(true);
        
        if (this.searchQuery) {
          this.articlesService.searchArticlesByTitle(this.searchQuery).subscribe({
            next: articles => {
              this.articlesService.articles.set(articles);
              if (articles.length > 0) {
                forkJoin([
                  this.articlesService.loadImagesForArticles(articles),
                  this.articlesService.loadAuthorsForArticles(articles)
                ]).subscribe({
                  complete: () => this.articlesService.loading.set(false)
                });
              } else {
                this.articlesService.loading.set(false);
              }
            },
            error: error => {
              console.error('Error en la búsqueda:', error);
              this.articlesService.loading.set(false);
            }
          });
        } else {
          this.articlesService.getArticles(true).subscribe({
            complete: () => this.articlesService.loading.set(false)
          });
        }
      }
    });
  }

  private lastLoadTime = 0;
  private loadDebounceTime = 1000;

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    const now = Date.now();
    if (now - this.lastLoadTime < this.loadDebounceTime) {
        return;
    }
    
    if (this.isNearBottom() && !this.articlesService.loading() && this.articlesService.hasMoreItems) {
        console.log('Activando carga de más artículos...');
        this.lastLoadTime = now;
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
    if (!this.searchQuery && !this.articlesService.loading() && this.articlesService.hasMoreItems) {
        console.log('Cargando más artículos...');
        this.articlesService.getArticles().subscribe({
            next: () => {
                this.articlesService.articles.update(articles => [...articles]);
            }
        });
    }
  }

  loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: data => this.categories = data,
      error: err => console.error('Error al cargar categorías', err)
    });
  }

  onCategorySelected(): void {
    this.articlesService.loading.set(true);
    this.articlesService.getArticles(true).subscribe({
      complete: () => this.articlesService.loading.set(false)
    });
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
    let articles = this.articlesService.articles() || [];
    
    if (!Array.isArray(articles)) {
        console.error('articles is not an array:', articles);
        return [];
    }

    if (this.selectedCategoryId !== null) {
        articles = articles.filter(article =>
            article?.categories?.some(category => category?.categoryId === this.selectedCategoryId)
        );
    }

    if (this.searchQuery) {
        const searchTerm = this.searchQuery.toLowerCase();
        articles = articles.filter(article => 
            article?.title?.toLowerCase().includes(searchTerm)
        );
    }

    if (articles.length === 0) return articles;

    switch (this.selectedSort) {
        case 'oldest':
            return [...articles].sort((a, b) => 
                new Date(a.publishDate || 0).getTime() - new Date(b.publishDate || 0).getTime());
        case 'views_asc':
            return [...articles].sort((a, b) => (a.views || 0) - (b.views || 0));
        case 'views_desc':
            return [...articles].sort((a, b) => (b.views || 0) - (a.views || 0));
        case 'newest':
        default:
            return [...articles].sort((a, b) => 
                new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime());
    }
  }
  
  clearFilters() {
    this.selectedCategoryId = null;
    this.selectedSort = 'newest';
    this.searchQuery = '';

    this.articlesService.loading.set(true);

    this.articlesService.resetPagination();

    this.router.navigate([], { 
      queryParams: { search: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    }).then(() => {
      this.articlesService.getArticles(true).subscribe({
        next: () => {
          this.articlesService.loading.set(false);
          this.cdRef.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar artículos:', error);
          this.articlesService.loading.set(false);
        }
      });
    });
  }

  showPermissionAlert() {
    Swal.fire({
      title: "Acceso denegado (aún)",
      text: "Necesitas ser ADMIN o EDITOR para crear artículos. ",
      icon: 'info',
      iconColor: '#008B8B',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#008B8B',
      background: 'rgba(44, 44, 44, 0.95)',
      color: '#FFFFFF'
    });
  }
}