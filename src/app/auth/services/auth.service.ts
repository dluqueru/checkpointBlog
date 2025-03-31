import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, pipe, tap } from 'rxjs';
import { loginResponse, RegisterResponse, Token, User } from '../../shared/interfaces/auth';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http: HttpClient = inject(HttpClient);
  private baseUrl: string = 'http://localhost:8080';
  private _username: string = '';
  private isLoggedSignal = signal<boolean>(false);
  private router: Router = inject(Router);

  constructor() {
    let username = localStorage.getItem('username');
    if (username) {
      this._username = username;
      this.isLoggedSignal.set(true);
    }
    this.validateToken().subscribe(resp => console.log(resp))
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
    if (this.isLogged()) {
      return true;
    }
    else {
      this.router.navigateByUrl('/login');
      return false;
    }
  }

  validateToken() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token') || ''}`)
    // ESTO NO ES EQUIVALENTE YA QUE SET DEVUELVE UNA CABECERA NUEVA NO MODIFICA 
    // const header = new HttpHeaders()
    // header.set('Authorization', `Bearer ${localStorage.getItem('token') || ''}`)
    return this.http.get<loginResponse>(`${this.baseUrl}/verify`, { headers })
      .pipe(
        map(resp => {
          this.setUserSession(resp.token);
          return true;
        }),
        catchError(err => of(false))

      )
  }

  setUserSession(token: string) {
    const decodedToken = this.getDecodedAccessToken(token);
    if (decodedToken) {
      console.log('Decoded token: ',decodedToken)
      this._username = decodedToken.username;
      localStorage.setItem('token', token);
      this.isLoggedSignal.set(true);
    }
  }

  login(username: string, password: string) {
    console.log('Enviando:', { username, password });
    return this.http.post<loginResponse>(`${this.baseUrl}/login`, { username, password })
      .pipe(
        tap({
          next: response => {
            console.log("Se loguió");
            this.setUserSession(response.token);
          }
        })
      )
  }

  get username() {
    return this._username;
  }

  register(userData: User): Observable<RegisterResponse> {
    console.log(userData)
    return this.http.post<any>(`${this.baseUrl}/register`, userData);
  }

  logout() {
    localStorage.removeItem('token');
    this._username = '';
    this.isLoggedSignal.set(false);
    this.router.navigateByUrl('/login')
  }
}