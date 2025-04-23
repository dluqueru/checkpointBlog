import { Component, inject, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { DefaultImageDirective } from '../directives/default-image.directive';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, DefaultImageDirective],
  templateUrl: './nav.component.html'
})
export class NavComponent implements AfterViewInit {
  authService = inject(AuthService);
  router = inject(Router);
  isMobileMenuOpen = false;
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
}