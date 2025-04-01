import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {

  private authService: AuthService = inject(AuthService);
  private http: HttpClient = inject(HttpClient);
  private router: Router = inject(Router);
  @ViewChild('myForm') myForm!: NgForm;

  submit() {
    this.authService.login(this.myForm.value.username, this.myForm.value.password)
      .subscribe({
        next: () => {
          
          Swal.fire({
            title: "Login correcto",
            text: "Has iniciado sesión",
            icon: 'success',
            iconColor: '#008B8B',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#008B8B',
            background: 'rgba(44, 44, 44, 0.95)',
            color: '#FFFFFF'
          }).then(
            () => this.router.navigateByUrl('/') // Redirección a home tras el login
          )

        },
        error: error => Swal.fire({
          title: 'Error!',
          text: "Credenciales incorrectas",
          icon: 'error',
          iconColor: '#d32f2f',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#008B8B',
          background: 'rgba(44, 44, 44, 0.95)',
          color: '#FFFFFF'
        })
      })
  }
}
