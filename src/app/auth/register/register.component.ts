import { Component, inject, ViewChild, OnDestroy } from '@angular/core';
import { AbstractControl, FormsModule, NgForm, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { User } from '../../shared/interfaces/auth';

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
  
  user: User = {
    username: '',
    name: '',
    email: '',
    photo: '',
    password: ''
  };

  imagePreview: string | null = null;
  checkingUsername = false;
  checkingEmail = false;
  usernameExists = false;
  emailExists = false;
  usernameAvailable = false;
  emailAvailable = false;
  private usernameDebounceTimer: any;
  private emailDebounceTimer: any;

  checkUsername(username: string) {
    clearTimeout(this.usernameDebounceTimer);
    this.checkingUsername = true;
    this.usernameAvailable = false;
    
    this.usernameDebounceTimer = setTimeout(() => {
      this.authService.checkUsernameExists(username).subscribe({
        next: exists => {
          this.usernameExists = exists;
          this.usernameAvailable = !exists;
          if (exists) {
            this.myForm.form.controls['username']?.setErrors({ usernameExists: true });
          } else {
            this.myForm.form.controls['username']?.updateValueAndValidity();
          }
        },
        complete: () => this.checkingUsername = false
      });
    }, 500);
  }

  checkEmail(email: string) {
    clearTimeout(this.emailDebounceTimer);
    this.checkingEmail = true;
    this.emailAvailable = false;
    
    this.emailDebounceTimer = setTimeout(() => {
      this.authService.checkEmailExists(email).subscribe({
        next: exists => {
          this.emailExists = exists;
          this.emailAvailable = !exists;
          if (exists) {
            this.myForm.form.controls['email']?.setErrors({ emailExists: true });
          } else {
            this.myForm.form.controls['email']?.updateValueAndValidity();
          }
        },
        complete: () => this.checkingEmail = false
      });
    }, 500);
  }

  removeImage() {
    this.imagePreview = null;
    this.user.photo = '';
    if (this.myForm && this.myForm.form.controls['profilePhoto']) {
      this.myForm.form.controls['profilePhoto'].setValue('');
      this.myForm.form.controls['profilePhoto'].markAsUntouched();
    }
  }

  submit() {
    if (this.myForm.invalid || this.checkingUsername || this.checkingEmail) {
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
  
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordPattern.test(this.user.password)) {
      Swal.fire({
        title: 'Contraseña inválida',
        text: 'Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.',
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
          this.router.navigateByUrl('/login');
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

  validatePassword(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;
    return pattern.test(password) ? null : { invalidPassword: true };
  }

  ngOnDestroy() {
    clearTimeout(this.usernameDebounceTimer);
    clearTimeout(this.emailDebounceTimer);
  }
}