import { Component, inject, ViewChild } from '@angular/core';
import { AbstractControl, FormsModule, NgForm, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { User } from '../../shared/interfaces/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private authService: AuthService = inject(AuthService);
  private http: HttpClient = inject(HttpClient);
  private router: Router = inject(Router);
  @ViewChild('myForm') myForm!: NgForm;
  profilePhoto: string = '';
  showPreview: boolean = false;

  user: User = {
    username: '',
    name: '',
    email: '',
    photo: '',
    password: ''
  };

  imagePreview: string | null = null;

  submit() {
    if (this.myForm.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        text: 'Por favor completa todos los campos requeridos correctamente',
        icon: 'error',
        iconColor: '#d32f2f',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#008B8B',
        background: 'rgba(44, 44, 44, 0.95)',
        color: '#FFFFFF'
      });
      return;
    }
  
    if (this.imagePreview) {
      this.user.photo = this.imagePreview;
    }
  
    this.authService.register(this.user).subscribe({
      next: (response) => {
        Swal.fire({
          title: "Registro exitoso",
          text: "Tu cuenta ha sido creada correctamente",
          icon: 'success',
          iconColor: '#008B8B',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#008B8B',
          background: 'rgba(44, 44, 44, 0.95)',
          color: '#FFFFFF'
        }).then(() => {
          this.router.navigateByUrl('/login') // Redirección a home tras registro
        });
      },
      error: (error) => {
        let errorMessage = 'Ocurrió un error durante el registro';
        
        if (error.status === 409) {
          errorMessage = 'El nombre de usuario o email ya está en uso';
        } else if (error.status === 400) {
          errorMessage = 'Datos de registro inválidos';
        }
  
        Swal.fire({
          title: 'Error en el registro',
          text: errorMessage,
          icon: 'error',
          iconColor: '#d32f2f',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#008B8B',
          background: 'rgba(44, 44, 44, 0.95)',
          color: '#FFFFFF'
        });
      }
    });
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  validateProfilePhoto(control: AbstractControl): ValidationErrors | null {
    const url = control.value;
    if (!url) return null;
    
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    if (!validExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
      return { invalidExtension: true };
    }
    
    return null;
  }

  checkImageUrl(url: string): void {
    if (this.isValidImageUrl(url)) {
      this.imagePreview = url;
    } else {
      this.imagePreview = null;
    }
  }

  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      new URL(url);
      return /\.(jpe?g|png|gif|bmp|webp)$/i.test(url);
    } catch {
      return false;
    }
  }

}