import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { UserResponse } from '../../shared/interfaces/auth';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private urlBase: string = 'https://api-2425-dluqueru-javaclean.onrender.com/likes';

  constructor(private http: HttpClient, private authService: AuthService) { }

  toggleLike(articleId: number): Observable<any> {
    return this.http.post(`${this.urlBase}/toggle?articleId=${articleId}`, {}).pipe(
      tap(() => {
            this.authService.getUserProfile(this.authService.username).subscribe({
          next: (userData: UserResponse) => {
            if(userData.reputation == 5) {
              Swal.fire({
                      title: "¡Ascenso de rango!",
                      text: "Has alcanzado el rol de EDITOR. Ahora podrás crear tus propios artículos!",
                      icon: 'success',
                      iconColor: '#008B8B',
                      confirmButtonText: 'Entendido',
                      confirmButtonColor: '#008B8B',
                      background: 'rgba(44, 44, 44, 0.95)',
                      color: '#FFFFFF'
                    });
              }
            this.authService.updateRole("EDITOR")
          },
          error: (err) => {
            console.error('Error actualizando datos de usuario', err);
          }
        });
      })
    );
  }

  getLikeCount(articleId: number): Observable<number> {
    return this.http.get<number>(`${this.urlBase}/count/${articleId}`);
  }

  hasUserLiked(articleId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.urlBase}/check?articleId=${articleId}`);
  }
}