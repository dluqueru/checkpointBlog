import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { Article, ArticlePost, ArticlePut, ArticlesResponse, Image } from '../../shared/interfaces/articles';
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
  private consecutiveEmptyLoads = 0;
  private maxConsecutiveEmptyLoads = 3;

  get articles() { return this.articleListSignal; }
  get articleImages() { return this.articleImagesSignal; }
  get articleAuthor() { return this.articleAuthorMapSignal; }
  get loading() { return this.loadingSignal; }
  get article() { return this.singleArticleSignal; }
  get hasMoreItems() { return this.hasMore; }

  getArticles(reset: boolean = false): Observable<void> {
    if (this.loadingSignal()) {
      return of(undefined).pipe(map(() => {}));
    }

    if (reset) {
        this.currentPage = 0;
        this.hasMore = true;
        this.consecutiveEmptyLoads = 0;
        this.articleListSignal.set([]);
        this.articleImagesSignal.set(new Map());
        this.articleAuthorMapSignal.set(new Map());
    } else if (!this.hasMore) {
        return of(undefined).pipe(map(() => {}));
    }

    this.loadingSignal.set(true);
    const nextPage = reset ? 0 : this.currentPage + 1;

    const params = new HttpParams()
      .set('page', nextPage.toString())
      .set('size', '4')
      .set('sort', 'publishDate,desc');

    return this.http.get<ArticlesResponse>(`${this.urlBase}/article`, { params }).pipe(
      tap(response => {
        const articles = response?.articles || [];
        
        if (reset) {
          this.articleListSignal.set(articles);
          this.articleImagesSignal.set(new Map());
          this.articleAuthorMapSignal.set(new Map());
        } else {
          this.articleListSignal.update(current => [...current, ...articles]);
        }

        this.hasMore = response?.hasNext || false;
        this.currentPage = response?.currentPage || nextPage;

        if (articles.length > 0) {
          forkJoin([
            this.loadImagesForArticles(articles),
            this.loadAuthorsForArticles(articles)
          ]).subscribe();
        }
      }),
      catchError(error => {
        console.error('Error cargando artículos:', error);
        this.hasMore = false;
        return of(undefined);
      }),
      finalize(() => {
        this.loadingSignal.set(false);
      }),
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
      this.http.get<User>(`${this.urlBase}/user/${username}`).pipe(
        catchError(() => of(null))
      )
    );

    return forkJoin(requests).pipe(
      map((users): User[] => users.filter((u): u is User => u !== null)),
      tap(users => {
        const userMap = new Map(this.articleAuthorMapSignal());
        users.forEach(user => {
          userMap.set(user.username, user);
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
        console.error(`Error cargando artículo ${articleId}:`, err);
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
    this.loadingSignal.set(true);
    this.resetPagination();
    
    return this.http.get<Article[]>(`${this.urlBase}/article/search?title=${encodeURIComponent(title)}`).pipe(
      tap(articles => {
        this.articleListSignal.set(articles);
        if (articles.length > 0) {
          forkJoin([
            this.loadImagesForArticles(articles),
            this.loadAuthorsForArticles(articles)
          ]).subscribe();
        }
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  reportArticle(articleId: number): Observable<Article> {
    return this.http.put<Article>(`${this.urlBase}/article/${articleId}/report`, null).pipe(
      catchError(error => {
        console.error('Error reportando artículo:', error);
        throw error;
      })
    );
  }

  unreportArticle(articleId: number): Observable<Article> {
    return this.http.put<Article>(`${this.urlBase}/article/${articleId}/unreport`, null).pipe(
      tap(unreportedArticle => {
        const currentArticle = this.singleArticleSignal();
        if (currentArticle?.id === articleId) {
          this.singleArticleSignal.set({...currentArticle, reported: false});
        }

        this.articleListSignal.update(articles => 
          articles.map(article => 
            article.id === articleId ? {...article, reported: false} : article
          )
        );
      }),
      catchError(error => {
        console.error('Error desreportando artículo:', error);
        throw error;
      })
    );
  }

  createArticle(articleData: ArticlePost): Observable<Article> {
      const headers = new HttpHeaders({
          'Content-Type': 'application/json'
      });

      return this.http.post<Article>(`${this.urlBase}/article`, articleData, { headers }).pipe(
          catchError(error => {
            console.log(error);
              if (error.status === 403) {
                  throw new Error('No tienes permisos para realizar esta acción');
              }
              throw error;
          })
      );
  }

  resetPagination(): void {
    this.currentPage = 0;
    this.hasMore = true;
    this.consecutiveEmptyLoads = 0;
    this.articleListSignal.set([]);
    this.articleImagesSignal.set(new Map());
    this.articleAuthorMapSignal.set(new Map());
    this.loadingSignal.set(false);
  }

  deleteArticle(articleId: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/article/${articleId}`).pipe(
      tap(() => {
        this.articleListSignal.update(articles => 
          articles.filter(article => article.id !== articleId)
        );
      })
    );
  }

  updateArticle(articleId: number, articleData: ArticlePut): Observable<Article> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<Article>(`${this.urlBase}/article/${articleId}`, articleData, { headers }).pipe(
      tap(updatedArticle => {
        this.singleArticleSignal.set(updatedArticle);
        this.articleListSignal.update(articles => 
          articles.map(article => 
            article.id === articleId ? updatedArticle : article
          )
        );
      }),
      catchError(error => {
        if (error.status === 403) {
          throw new Error('No tienes permisos para realizar esta acción');
        }
        throw error;
      })
    );
  }

  getReportedArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.urlBase}/article/reported`).pipe(
      catchError(error => {
        console.error('Error cargando artículos reportados:', error);
        return of([]);
      })
    );
  }
}