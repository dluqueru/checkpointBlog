import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { Article } from '../../shared/interfaces/articles';

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {

  private http: HttpClient = inject(HttpClient);
  private authService: AuthService = inject(AuthService);
  private isLogged: boolean = false;
  private urlBase: string = 'http://localhost:8080/article';

  private articleListSignal = signal<Article[]>([]);

  constructor(){ }

  get articles() {
    return this.articleListSignal;
  }

  
  getArticles(): void{
    this.http.get<Article[]>(`${this.urlBase}`)
    .subscribe({
      next: articles => {
        console.log('Artículos: ', articles)
        this.articleListSignal.set(articles)
      },
      error: error => console.log('Error: ', error)
    })
  }
}
