import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { ArticlesService } from '../../articles/services/articles.service';
import { CommonModule, DatePipe } from '@angular/common';
import { DefaultImageDirective } from '../../shared/directives/default-image.directive';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, DefaultImageDirective, CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  user: any;
  loading = true;
  loadingArticles = false;
  loadingReportedArticles = false;
  isCurrentUser = false;
  username: string = '';
  likedArticles: any[] = [];
  reportedArticles: any[] = [];
  likedArticlesCount: number = 0;

  constructor(
    private route: ActivatedRoute,
    public authService: AuthService,
    private articlesService: ArticlesService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.username = params['username'];
      this.loadUserProfile();
      this.loadLikedArticles();

      if (this.authService.isAdmin()) {
        this.loadReportedArticles();
      }
    });
  }

  loadUserProfile(): void {
    this.authService.getUserProfile(this.username).subscribe({
      next: (userData) => {
        this.user = userData;
        this.isCurrentUser = this.authService.username === this.username;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando el perfil:', err);
        this.loading = false;
      }
    });
  }

  loadLikedArticles(): void {
    this.loadingArticles = true;
    this.authService.getLikedArticles(this.username).subscribe({
      next: (articles) => {
        this.likedArticles = articles;
        this.likedArticlesCount = this.likedArticles.length;
        this.loadingArticles = false;

        if (articles.length > 0) {
          this.articlesService.loadImagesForArticles(articles).subscribe();
          this.articlesService.loadAuthorsForArticles(articles).subscribe();
        }
      },
      error: (err) => {
        console.error('Error cargando artículos likeados:', err);
        this.loadingArticles = false;
      }
    });
  }

  loadReportedArticles(): void {
    this.loadingReportedArticles = true;
    this.articlesService.getReportedArticles().subscribe({
      next: (articles) => {
        this.reportedArticles = articles || [];
        this.loadingReportedArticles = false;

        if (this.reportedArticles.length > 0) {
          this.articlesService.loadImagesForArticles(this.reportedArticles).subscribe();
          this.articlesService.loadAuthorsForArticles(this.reportedArticles).subscribe();
        }
      },
      error: (err) => {
        console.error('Error cargando artículos reportados:', err);
        this.loadingReportedArticles = false;
      }
    });
  }

  getMainImageForArticle(articleId: number): string | undefined {
    const images = this.articlesService.articleImages().get(articleId);
    return images?.[0]?.imageUrl;
  }

  getAuthorAvatar(username: string): string | undefined {
    const map = this.articlesService.articleAuthor();
    return map.get(username)?.photo;
  }
}