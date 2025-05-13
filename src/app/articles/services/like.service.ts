import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private urlBase: string = 'http://localhost:8080/likes';

  constructor(private http: HttpClient) { }

  toggleLike(articleId: number): Observable<any> {
    return this.http.post(`${this.urlBase}/toggle?articleId=${articleId}`, {});
  }

  getLikeCount(articleId: number): Observable<number> {
    return this.http.get<number>(`${this.urlBase}/count/${articleId}`);
  }

  hasUserLiked(articleId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.urlBase}/check?articleId=${articleId}`);
  }
}