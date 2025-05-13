import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, pipe, tap } from 'rxjs';
import { LoginResponse, RegisterResponse, Token, User, UserResponse } from '../../shared/interfaces/auth';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http: HttpClient = inject(HttpClient);
  private baseUrl: string = 'http://localhost:8080';
  private _username: string = '';
  private _role: string = '';
  private _photo: string = '';
  private isLoggedSignal = signal<boolean>(false);
  private router: Router = inject(Router);
  public redirectUrl: string | null = null;

  constructor() {
    let username = localStorage.getItem('username');
    let role = localStorage.getItem('role');
    let photo = localStorage.getItem('photo');
    if (username) {
      this._username = username;
      this.isLoggedSignal.set(true);
    }
    if (role) {
      this._role = role;
    }
    if (photo) {
      this._photo = photo;
    }
  }

  getDecodedAccessToken(token: string): Token | null {
    try {
      return jwtDecode(token);
    } catch (Error) {
      return null;
    }
  }

  get isLogged() {
    return this.isLoggedSignal.asReadonly();
  }

  isLoggedF(): boolean {
    return this.isLogged();
  }

  setUserSession(token: string) {
    const decodedToken = this.getDecodedAccessToken(token);
    if (decodedToken) {
      this._username = decodedToken.username;
      this._role = decodedToken.role;
      localStorage.setItem('token', token);
      localStorage.setItem('username', this._username);
      localStorage.setItem('role', this._role);
      this.isLoggedSignal.set(true);
    }
  }

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { username, password })
      .pipe(
        tap({
          next: response => {
            this.setUserSession(response.token);
            this.getUserPhoto(username, response.token).subscribe({
              next: () => {
                const destination = this.redirectUrl ?? '/';
                this.redirectUrl = null;
                this.router.navigateByUrl(destination);
              },
              error: err => console.error("Error al obtener foto:", err)
            });
          }
        })
      );
  }

  getUserPhoto(username: string, token: string) {
    const headers = new HttpHeaders({
      'Authorization': token
    });
    return this.http.get<UserResponse>(`${this.baseUrl}/user/${username}`, { headers })
      .pipe(
        tap({
          next: response => {
            this._photo = response.photo;
            localStorage.setItem('photo', response.photo);
          }
        })
      );
  }

  get username() {
    return this._username;
  }

  get role() {
    return this._role;
  }

  get photo() {
    return this._photo;
  }

  register(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, formData, {
        observe: 'response'
    }).pipe(
        map(response => response.body)
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('photo');
    this._username = '';
    this._role = '';
    this._photo = '';
    this.isLoggedSignal.set(false);
    this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    const decoded = this.getDecodedAccessToken(token);
    if (!decoded || !decoded.exp) return true;
    
    return Date.now() >= decoded.exp * 1000;
  }

  checkUsernameExists(username: string): Observable<boolean> {
    return this.http.get<User>(`${this.baseUrl}/user/${username}`).pipe(
      map(() => true),
      catchError(error => error.status === 404 ? of(false) : of(false))
    );
  }
  
  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<User[]>(`${this.baseUrl}/user`).pipe(
      map(users => users.some(user => user.email === email)),
      catchError(() => of(false))
    );
  }

  uploadProfileImage(username: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return new Observable(observer => {
      this.http.post(`${this.baseUrl}/user/${username}/profile-image`, formData, {
        reportProgress: true,
        observe: 'events',
        headers: new HttpHeaders({
          'Accept': 'application/json'
        })
      }).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            observer.next({
              type: 'uploadProgress',
              loaded: event.loaded,
              total: event.total
            });
          } else if (event.body) {
            observer.next({
              type: 'complete',
              imageUrl: event.body.imageUrl,
              publicId: event.body.publicId
            });
            observer.complete();
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  getUserProfile(username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/${username}`);
  }

  getLikedArticles(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/${username}/liked-articles`);
  }
}