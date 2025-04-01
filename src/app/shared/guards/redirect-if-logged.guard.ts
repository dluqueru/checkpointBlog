import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { inject } from '@angular/core';

export const redirectIfLoggedGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router = inject(Router);

  console.log("Guard revisando login");
  return authService.isLogged() ? router.createUrlTree(['/']) : true;
};