import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ArticlesService } from '../services/articles.service';
import { QuillModule, QuillModules } from 'ngx-quill';
import { Router } from '@angular/router';
import { CategoriesService } from '../services/categories.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';
import { catchError, map, of, switchMap } from 'rxjs';
import { ArticlePost } from '../../shared/interfaces/articles';

@Component({
  selector: 'app-article-form',
  templateUrl: './article-form.component.html',
  standalone: true,
  imports: [
    QuillModule,
    ReactiveFormsModule,
    CommonModule
  ]
})
export class ArticleFormComponent implements OnInit {
  articleForm: FormGroup;
  isSubmitting = false;
  status: 'DRAFT' | 'DEFINITIVE' = 'DRAFT';
  categories: { id: number, name: string }[] = [];
  selectedCategories: number[] = [];
  featuredImage: File | null = null;
  selectedImagePreview: string | ArrayBuffer | null = null;

  quillConfig: QuillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image', 'video'],
      ['clean']
    ],
    theme: 'snow',
    bounds: document.body,
    placeholder: 'Escribe el contenido de tu artículo aquí...',
    formats: [
      'bold', 'italic', 'underline', 'strike',
      'blockquote', 'code-block',
      'header', 'list',
      'link', 'image', 'video'
    ]
  };

  constructor(
    private fb: FormBuilder,
    private articlesService: ArticlesService,
    private categoriesService: CategoriesService,
    private authService: AuthService,
    private router: Router
  ) {
    this.articleForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      body: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe(
      (response) => {
        this.categories = response;
      }
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.featuredImage = file;
      const reader = new FileReader();

      reader.onload = (e) => {
        this.selectedImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.featuredImage = null;
    this.selectedImagePreview = null;
    const fileInput = document.getElementById('featuredImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  toggleCategory(categoryId: number): void {
    const index = this.selectedCategories.indexOf(categoryId);
    if (index === -1) {
      this.selectedCategories.push(categoryId);
    } else {
      this.selectedCategories.splice(index, 1);
    }
  }

  saveAsDraft(): void {
    this.status = 'DRAFT';
    this.submitArticle();
  }

  publish(): void {
    this.status = 'DEFINITIVE';
    this.submitArticle();
  }

  private submitArticle(): void {
    if (this.articleForm.invalid) {
      this.articleForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const formattedDate = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

    const articleData: ArticlePost = {
      title: this.articleForm.get('title')?.value,
      body: this.articleForm.get('body')?.value,
      reported: false,
      state: this.status,
      publishDate: this.status === 'DEFINITIVE' ? formattedDate : null,
      views: 0,
      user: {
          username: this.authService.username
      },
      articleCategories: this.selectedCategories.map(id => ({
          category: {
              id: id
          }
      }))
    };

    this.articlesService.createArticle(articleData).pipe(
      switchMap(article => {
        if (this.featuredImage) {
          return this.articlesService.uploadImage(article.id, this.featuredImage).pipe(
            catchError(() => of(article)),
            map(() => article)
          );
        }
        return of(article);
      })
    ).subscribe({
      next: (article) => {
        this.handleSuccess();
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error:', error);
      }
    });
  }

  private handleSuccess(): void {
    this.isSubmitting = false;
    this.articlesService.articles.set([]);
    this.router.navigate(['/article'], { 
        queryParams: { refresh: new Date().getTime() } 
    });
  }
}