import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { Article, Image } from '../../shared/interfaces/articles';
import { forkJoin, Observable, tap } from 'rxjs';
import { User } from '../../shared/interfaces/auth';

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {
  private http: HttpClient = inject(HttpClient);
  private authService: AuthService = inject(AuthService);
  private urlBase: string = 'http://localhost:8080';

  private articleListSignal = signal<Article[]>([]);
  articleImagesSignal = signal<Map<number, Image[]>>(new Map());
  articleAuthorMapSignal = signal<Map<string, User>>(new Map());
  private loadingSignal = signal<boolean>(false);
  singleArticleSignal = signal<Article | null>(null);

  get articles() { return this.articleListSignal; }
  get articleImages() { return this.articleImagesSignal; }
  get articleAuthor() { return this.articleAuthorMapSignal; }
  get loading() { return this.loadingSignal; }
  get article() { return this.singleArticleSignal; }

  getArticles(): void {
    this.loadingSignal.set(true);
    this.articleListSignal.set([]);
    
    this.http.get<Article[]>(`${this.urlBase}/article`).pipe(
      tap(articles => this.articleListSignal.set(articles))
    ).subscribe({
      next: articles => {
        if (articles.length === 0) {
          this.loadingSignal.set(false);
          return;
        }

        forkJoin([
          this.loadImagesForArticles(articles),
          this.loadAuthorsForArticles(articles)
        ]).subscribe({
          complete: () => this.loadingSignal.set(false)
        });
      },
      error: error => {
        console.error('Error cargando artículos:', error);
        this.loadingSignal.set(false);
      }
    });
  }

  private loadImagesForArticles(articles: Article[]): Observable<Image[][]> {
    const requests = articles.map(article => 
      this.http.get<Image[]>(`${this.urlBase}/api/images/article/${article.id}`)
    );
    
    return forkJoin(requests).pipe(
      tap(imageLists => {
        const imagesMap = new Map<number, Image[]>();
        articles.forEach((article, index) => {
          imagesMap.set(article.id, imageLists[index]);
        });
        this.articleImagesSignal.set(imagesMap);
      })
    );
  }

  private loadAuthorsForArticles(articles: Article[]): Observable<User[]> {
    const uniqueUsernames = [...new Set(articles.map(a => a.username))];
    const requests = uniqueUsernames.map(username => 
      this.http.get<User>(`${this.urlBase}/user/${username}`)
    );
    
    return forkJoin(requests).pipe(
      tap(users => {
        const userMap = new Map<string, User>();
        uniqueUsernames.forEach((username, index) => {
          userMap.set(username, users[index]);
        });
        this.articleAuthorMapSignal.set(userMap);
      })
    );
  }

  getArticleById(articleId: number): void {
    this.loadingSignal.set(true);
    
    forkJoin([
        this.http.get<Article>(`${this.urlBase}/article/${articleId}`),
        this.http.get<Image[]>(`${this.urlBase}/api/images/article/${articleId}`)
    ]).subscribe({
        next: ([article, images]) => {
            this.singleArticleSignal.set(article);

            const newMap = new Map(this.articleImagesSignal());
            newMap.set(articleId, images);
            this.articleImagesSignal.set(newMap);
            
            this.loadAuthor(article.username);
        },
        error: (err) => {
            console.error(`Error loading article ${articleId}:`, err);
            this.loadingSignal.set(false);
        },
        complete: () => this.loadingSignal.set(false)
    });
  }

  private loadAuthor(username: string): void {
    this.http.get<User>(`${this.urlBase}/user/${username}`).subscribe({
      next: user => {
        const userMap = new Map<string, User>();
        userMap.set(username, user);
        this.articleAuthorMapSignal.set(userMap);
      },
      error: err => console.error(`Error cargando usuario ${username}:`, err)
    });
  }

  uploadImage(articleId: number, file: File): Observable<Image> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Image>(
      `${this.urlBase}/api/images/upload/${articleId}`, 
      formData
    ).pipe(
      tap(newImage => {
        const currentImages = this.articleImagesSignal().get(articleId) || [];
        this.articleImagesSignal().set(articleId, [...currentImages, newImage]);
        this.articleImagesSignal.set(new Map(this.articleImagesSignal()));
      })
    );
  }

  deleteImage(imageId: number, articleId: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/api/images/${imageId}`).pipe(
      tap(() => {
        const currentImages = this.articleImagesSignal().get(articleId) || [];
        const updatedImages = currentImages.filter(img => img.id !== imageId);
        this.articleImagesSignal().set(articleId, updatedImages);
        this.articleImagesSignal.set(new Map(this.articleImagesSignal()));
      })
    );
  }
}