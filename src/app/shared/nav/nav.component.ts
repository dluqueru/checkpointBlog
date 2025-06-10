import { Component, inject, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { DefaultImageDirective } from '../directives/default-image.directive';
import { ArticlesService } from '../../articles/services/articles.service';
import { FormsModule } from '@angular/forms';
import { ListComponent } from '../../articles/list/list.component';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, DefaultImageDirective, FormsModule],
  templateUrl: './nav.component.html'
})
export class NavComponent implements AfterViewInit {
  authService = inject(AuthService);
  router = inject(Router);
  articlesService = inject(ArticlesService);
  listComponent = inject(ListComponent)
  isMobileMenuOpen = false;
  searchQuery = '';
  private mobileMenu: HTMLElement | null = null;

  isLoginRoute(): boolean {
    return this.router.url === '/login';
  }

  ngAfterViewInit() {
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    this.mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuButton && this.mobileMenu) {
      mobileMenuButton.addEventListener('click', () => this.toggleMobileMenu());
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    
    if (this.mobileMenu) {
      if (this.isMobileMenuOpen) {
        this.mobileMenu.style.maxHeight = this.mobileMenu.scrollHeight + 'px';
      } else {
        this.mobileMenu.style.maxHeight = '0';
      }
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    if (this.mobileMenu) {
      this.mobileMenu.style.maxHeight = '0';
    }
  }

  logout() {
    this.authService.logout();
    this.closeMobileMenu();
  }

  navigateToHome() {
    this.articlesService.resetPagination();
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  searchArticles(event: Event) {
    event.preventDefault();
    if (this.searchQuery.trim()) {
      this.articlesService.resetPagination();
      this.listComponent.selectedCategoryId = null;
      this.listComponent.selectedSort = 'newest';
      this.router.navigate(['/'], { 
        queryParams: { search: this.searchQuery.trim() },
        queryParamsHandling: 'merge'
      });
    } else {
      this.articlesService.resetPagination();
      this.router.navigate(['/']).then(() => {
        this.articlesService.getArticles(true).subscribe();
      });
    }
    this.searchQuery = '';
    this.closeMobileMenu();
  }
}