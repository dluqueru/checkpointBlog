// role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import Swal from 'sweetalert2';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const canCreate = this.authService.canCreateArticle();

    if (!canCreate) {
      Swal.fire({
        title: "Acceso denegado",
        text: "No tienes permisos para acceder a esta página.",
        icon: 'error',
        iconColor: '#d32f2f',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#008B8B',
        background: 'rgba(44, 44, 44, 0.95)',
        color: '#FFFFFF'
      });
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}