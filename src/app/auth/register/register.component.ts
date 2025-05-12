import { Component, inject, ViewChild, OnDestroy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { User } from '../../shared/interfaces/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnDestroy {
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  @ViewChild('myForm') myForm!: NgForm;
  
  user: Omit<User, 'photo' | 'imagePublicId'> = {
    username: '',
    name: '',
    email: '',
    password: ''
  };

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadError: string | null = null;
  isUploading: boolean = false;
  checkingUsername = false;
  checkingEmail = false;
  usernameExists = false;
  emailExists = false;
  private subs: Subscription[] = [];

  readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;
  readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.uploadError = 'Solo se permiten imágenes JPEG, PNG o WEBP';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'La imagen no debe exceder 5MB';
        return;
      }
      
      this.selectedFile = file;
      this.uploadError = null;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadError = null;
    const fileInput = document.getElementById('profilePhoto') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  checkUsername(username: string): void {
    if (!username || username.length < 3) return;
    
    this.checkingUsername = true;
    
    const sub = this.authService.checkUsernameExists(username).subscribe({
      next: exists => {
        this.usernameExists = exists;
        if (exists) {
          this.myForm.form.controls['username']?.setErrors({ usernameExists: true });
        }
      },
      complete: () => this.checkingUsername = false
    });
    this.subs.push(sub);
  }

  checkEmail(email: string): void {
    if (!email) return;
    
    this.checkingEmail = true;
    
    const sub = this.authService.checkEmailExists(email).subscribe({
      next: exists => {
        this.emailExists = exists;
        if (exists) {
          this.myForm.form.controls['email']?.setErrors({ emailExists: true });
        }
      },
      complete: () => this.checkingEmail = false
    });
    this.subs.push(sub);
  }

  submit(): void {
    if (this.myForm.invalid) {
      this.showError('Formulario inválido', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (this.checkingUsername || this.checkingEmail) {
      this.showError('Validación en curso', 'Espera a que terminen las validaciones');
      return;
    }

    if (!this.passwordPattern.test(this.user.password)) {
      this.showError(
        'Contraseña inválida',
        'Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.'
      );
      return;
    }

    this.isUploading = true;
    const formData = new FormData();

    formData.append('username', this.user.username);
    formData.append('name', this.user.name);
    formData.append('email', this.user.email);
    formData.append('password', this.user.password);
    
    if (this.selectedFile) {
        formData.append('file', this.selectedFile, this.selectedFile.name);
    }

    const registerSub = this.authService.register(formData).subscribe({
        next: () => {
            this.showSuccess('Registro exitoso', 'Tu cuenta ha sido creada', () => {
                this.router.navigate(['/login']);
            });
        },
        error: (error) => {
            console.error('Error:', error);
            this.isUploading = false;
            const message = error.status === 409 
                ? 'El usuario o email ya existe' 
                : 'Error en el registro. Inténtalo de nuevo';
            this.showError('Error', message);
        }
    });
    this.subs.push(registerSub);
  }

  private showError(title: string, text: string): void {
    Swal.fire({
      title,
      text,
      icon: 'error',
      iconColor: '#d32f2f',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#008B8B',
      background: 'rgba(44, 44, 44, 0.95)',
      color: '#FFFFFF'
    });
  }

  private showSuccess(title: string, text: string, callback?: () => void): void {
    Swal.fire({
      title,
      text,
      icon: 'success',
      iconColor: '#008B8B',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#008B8B',
      background: 'rgba(44, 44, 44, 0.95)',
      color: '#FFFFFF'
    }).then(() => callback?.());
  }

  imageError(): void {
    this.imagePreview = null;
    this.uploadError = 'Error al cargar la imagen';
    this.selectedFile = null;
    
    const fileInput = document.getElementById('profileImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}