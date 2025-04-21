import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { inject } from '@angular/core';

export const loginGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedF()) {
    return true;
  } else {
    authService.redirectUrl = state.url;
    return router.createUrlTree(['/login']);
  }
};