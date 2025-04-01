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
  private _role: string = '';
  private isLoggedSignal = signal<boolean>(false);
  private router: Router = inject(Router);

  constructor() {
    let username = localStorage.getItem('username');
    let role = localStorage.getItem('role');
    if (username) {
      this._username = username;
      this.isLoggedSignal.set(true);
    }
    if (role) {
      this._role = role;
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
    if (this.isLogged()) {
      return true;
    }
    else {
      this.router.navigateByUrl('/login');
      return false;
    }
  }

  setUserSession(token: string) {
    const decodedToken = this.getDecodedAccessToken(token);
    if (decodedToken) {
      console.log('Decoded token: ', decodedToken);
      this._username = decodedToken.username;
      this._role = decodedToken.role;
      localStorage.setItem('token', token);
      localStorage.setItem('username', this._username);
      localStorage.setItem('role', this._role);
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

  get role() {
    return this._role;
  }

  register(userData: User): Observable<RegisterResponse> {
    console.log(userData);
    return this.http.post<any>(`${this.baseUrl}/register`, userData);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    this._username = '';
    this._role = '';
    this.isLoggedSignal.set(false);
    this.router.navigateByUrl('/login');
  }
}