import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { Article, Image } from '../../shared/interfaces/articles';
import { forkJoin } from 'rxjs';
import { User } from '../../shared/interfaces/auth';

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {

  private http: HttpClient = inject(HttpClient);
  private authService: AuthService = inject(AuthService);
  private isLogged: boolean = false;
  private urlBase: string = 'http://localhost:8080';

  private articleListSignal = signal<Article[]>([]);
  private articleMainImageSignal = signal<Map<number, Image>>(new Map());
  private articleAuthorMapSignal = signal<Map<string, User>>(new Map());

  constructor(){ }

  get articles() {
    return this.articleListSignal;
  }

  get articleMainImages() {
    return this.articleMainImageSignal;
  }

  get articleAuthor() {
    return this.articleAuthorMapSignal;
  }
  
  getArticles(): void {
    this.http.get<Article[]>(`${this.urlBase}/article`).subscribe({
      next: articles => {
        console.log('Artículos: ', articles);
        this.articleListSignal.set(articles);
  
        const imageRequests = articles.map(article =>
          this.http.get<Image[]>(`${this.urlBase}/images/${article.id}`)
        );
  
        const uniqueUsernames = [...new Set(articles.map(article => article.username))];
        const userRequests = uniqueUsernames.map(username =>
          this.http.get<User>(`${this.urlBase}/user/${username}`)
        );
  
        forkJoin([forkJoin(imageRequests), forkJoin(userRequests)]).subscribe({
          next: ([allImagesLists, allUsers]) => {
            const imageMap = new Map<number, Image>();
            articles.forEach((article, index) => {
              const images = allImagesLists[index];
              if (images.length > 0) {
                const mainImage = images.sort((a, b) => a.id - b.id)[0];
                imageMap.set(article.id, mainImage);
              }
            });
            this.articleMainImageSignal.set(imageMap);
  
            const userMap = new Map<string, User>();
            uniqueUsernames.forEach((username, index) => {
              userMap.set(username, allUsers[index]);
            });
            this.articleAuthorMapSignal.set(userMap);
          },
          error: err => console.log('Error cargando imágenes o usuarios:', err)
        });
      },
      error: error => console.log('Error cargando artículos:', error)
    });
  }
}
