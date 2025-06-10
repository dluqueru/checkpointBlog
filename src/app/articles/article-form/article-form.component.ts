import { Component, EnvironmentInjector, OnInit, inject, runInInjectionContext } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ArticlesService } from '../services/articles.service';
import { QuillModule, QuillModules } from 'ngx-quill';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoriesService } from '../services/categories.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';
import { catchError, map, of, switchMap, forkJoin, finalize } from 'rxjs';
import { ArticlePost, ArticlePut } from '../../shared/interfaces/articles';
import Swal from 'sweetalert2';

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
  isEditMode = false;
  articleId: number | null = null;
  existingImages: any[] = [];
  imagesToDelete: number[] = [];
  originalAuthor: string = "";
  originalPublishDate: string | null = null;
  private injector = inject(EnvironmentInjector);

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
    private router: Router,
    private route: ActivatedRoute
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

    this.route.paramMap.subscribe(params => {
      const articleId = params.get('articleId');
      if (articleId) {
        this.isEditMode = true;
        this.articleId = +articleId;
        this.loadArticleForEdit();
      }
    });
  }

  loadArticleForEdit(): void {
    if (!this.articleId) return;

    this.articlesService.getArticleById(this.articleId);

    const article = this.articlesService.singleArticleSignal();
    if (!article) return;

    const imagesMap = this.articlesService.articleImagesSignal();
    const images = imagesMap.get(this.articleId) || [];
    
    this.existingImages = images;
    this.articleForm.patchValue({
      title: article.title,
      body: article.body
    });
    
    this.status = article.state as 'DRAFT' | 'DEFINITIVE';
    this.selectedCategories = article.categories?.map(category => category.categoryId) || [];
    this.originalPublishDate = article.publishDate;
    this.originalAuthor = article.username;
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

  removeExistingImage(imageId: number): void {
    this.imagesToDelete.push(imageId);
    this.existingImages = this.existingImages.filter(img => img.id !== imageId);
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
    const formattedDate = now.toISOString();

    if (this.isEditMode && this.articleId) {
      const articlePutData: ArticlePut = {
        id: this.articleId,
        title: this.articleForm.get('title')?.value,
        body: this.articleForm.get('body')?.value,
        reported: false,
        state: this.status,
        publishDate: this.status === 'DEFINITIVE' 
          ? (this.originalPublishDate || formattedDate)
          : null,
        views: 0,
        username: this.originalAuthor,
        categories: this.selectedCategories.map(id => ({
          categoryId: id,
          categoryName: this.categories.find(c => c.id === id)?.name || ''
        }))
      };

      this.articlesService.updateArticle(this.articleId, articlePutData).pipe(
        switchMap(article => {
          if (this.imagesToDelete.length === 0) {
            return of(article);
          }
          
          const deleteOperations = this.imagesToDelete.map(imageId => 
            this.articlesService.deleteImage(imageId, article.id).pipe(
              catchError(error => {
                console.error('Error eliminando imagen:', error);
                return of(null);
              })
            )
          );

          return forkJoin(deleteOperations).pipe(
            map(() => article)
          );
        }),
        switchMap(article => {
          if (!this.featuredImage) {
            return of(article);
          }
          return this.articlesService.uploadImage(article.id, this.featuredImage).pipe(
            catchError(error => {
              console.error('Error subiendo imagen:', error);
              return of(article);
            })
          );
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      ).subscribe({
        next: (article) => {
          Swal.fire({
            title: "Artículo actualizado",
            text: "El artículo fue editado con éxito",
            icon: 'success',
            iconColor: '#008B8B',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#008B8B',
            background: 'rgba(44, 44, 44, 0.95)',
            color: '#FFFFFF'
          });
          this.handleSuccess();
        },
        error: (error) => {
          console.error('Error actualizando artículo:', error);
          Swal.fire({
            title: 'Error!',
            text: "Ocurrió un error al actualizar tu artículo.",
            icon: 'error',
            iconColor: '#d32f2f',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#008B8B',
            background: 'rgba(44, 44, 44, 0.95)',
            color: '#FFFFFF'
          })
          this.isSubmitting = false;

          if (error.status === 403) {
            console.error('Sesión expirada. Por favor vuelve a iniciar sesión.');
          }
        }
      });
    } else {
      const articlePostData: ArticlePost = {
        title: this.articleForm.get('title')?.value,
        body: this.articleForm.get('body')?.value,
        reported: false,
        state: this.status,
        publishDate: this.status === 'DEFINITIVE' ? this.getFormattedDate() : null,
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

      this.articlesService.createArticle(articlePostData).pipe(
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
          Swal.fire({
            title: "Artículo creado",
            text: "Artículo creado con éxito",
            icon: 'success',
            iconColor: '#008B8B',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#008B8B',
            background: 'rgba(44, 44, 44, 0.95)',
            color: '#FFFFFF'
          });
          this.handleSuccess();
        },
        error: (error) => {
          Swal.fire({
            title: 'Error!',
            text: "Ocurrió un error al crear tu artículo.",
            icon: 'error',
            iconColor: '#d32f2f',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#008B8B',
            background: 'rgba(44, 44, 44, 0.95)',
            color: '#FFFFFF'
          })
          this.isSubmitting = false;
          console.error('Error:', error);
        }
      });
    }
  }

  private handleSuccess(): void {
    this.isSubmitting = false;
    this.articlesService.articles.set([]);
    const redirectUrl = this.isEditMode ? `/article/${this.articleId}` : '/article';
    this.router.navigate([redirectUrl], { 
      queryParams: { refresh: new Date().getTime() } 
    });
  }

  private getFormattedDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }
}