import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (req.url.includes('/login') || req.url.includes('/register')) {
    return next(req);
  }

  const token = authService.getToken();
  
  if (token) {
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    const authReq = req.clone({
      headers: req.headers.set('Authorization', authHeader)
    });
    
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          authService.logout();
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
  
  return next(req);
};