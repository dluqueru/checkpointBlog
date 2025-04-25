import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class redirectIfLoggedGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedF()) {
      this.router.navigate(['/']);
      return false;
    }
    return true;
  }
}