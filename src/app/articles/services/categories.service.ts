import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  private http: HttpClient = inject(HttpClient);
  private urlBase: string = 'http://localhost:8080';

  getCategories(): Observable<{id: number, name: string}[]> {
    return this.http.get<{id: number, name: string}[]>(`${this.urlBase}/category`);
  }

  getArticlesByCategory(categoryId: number): Observable<any> {
    return this.http.get(`${this.urlBase}/category/${categoryId}`);
  }
}