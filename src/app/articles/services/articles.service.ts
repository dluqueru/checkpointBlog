import { HttpClient, HttpEvent, HttpEventType, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { Article, ArticlesResponse, Image } from '../../shared/interfaces/articles';
import { catchError, finalize, forkJoin, map, Observable, of, tap } from 'rxjs';
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
  private currentPage = 0;
  private hasMore = true;

  get articles() { return this.articleListSignal; }
  get articleImages() { return this.articleImagesSignal; }
  get articleAuthor() { return this.articleAuthorMapSignal; }
  get loading() { return this.loadingSignal; }
  get article() { return this.singleArticleSignal; }
  get hasMoreItems() { return this.hasMore; }

  getArticles(reset: boolean = false): Observable<void> {
    if (this.loadingSignal() || (!reset && !this.hasMore)) {
        return of(undefined).pipe(map(() => {}));
    }

    if (reset) {
        this.currentPage = 0;
        this.hasMore = true;
        this.articleListSignal.set([]);
        this.articleImagesSignal.set(new Map());
        this.articleAuthorMapSignal.set(new Map());
    }

    this.loadingSignal.set(true);

    const params = new HttpParams()
        .set('page', this.currentPage.toString())
        .set('size', '4');

    return this.http.get<ArticlesResponse>(`${this.urlBase}/article`, { params }).pipe(
        tap(response => {
            const articles = response?.articles || [];
            this.hasMore = response?.hasNext || false;
            
            this.currentPage = response?.currentPage || this.currentPage + 1;
            this.articleListSignal.update(current => [...current, ...articles]);

            if (articles.length > 0) {
                forkJoin([
                    this.loadImagesForArticles(articles),
                    this.loadAuthorsForArticles(articles)
                ]).subscribe({
                    error: (err) => {
                        console.error('Error cargando imágenes o autores:', err);
                        const currentImages = this.articleImagesSignal();
                        articles.forEach(article => {
                            if (!currentImages.has(article.id)) {
                                currentImages.set(article.id, []);
                            }
                        });
                        this.articleImagesSignal.set(new Map(currentImages));
                    }
                });
            }
        }),
        catchError(error => {
            console.error('Error cargando artículos:', error);
            this.hasMore = false;
            return of(undefined);
        }),
        finalize(() => this.loadingSignal.set(false)),
        map(() => {})
    );
  }

  loadImagesForArticles(articles: Article[]): Observable<Image[][]> {
    const requests = articles.map(article => 
      this.http.get<Image[]>(`${this.urlBase}/api/images/article/${article.id}`).pipe(
        catchError(() => of([]))
      )
    );
    
    return forkJoin(requests).pipe(
      tap(imageLists => {
        const currentImages = new Map(this.articleImagesSignal());
        articles.forEach((article, index) => {
          if (!currentImages.has(article.id) || imageLists[index].length > 0) {
            currentImages.set(article.id, imageLists[index]);
          }
        });
        this.articleImagesSignal.set(currentImages);
      })
    );
  }

  loadAuthorsForArticles(articles: Article[]): Observable<User[]> {
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

  searchArticlesByTitle(title: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.urlBase}/article/search?title=${encodeURIComponent(title)}`);
  }
}