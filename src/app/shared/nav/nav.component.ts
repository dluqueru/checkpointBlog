import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { DefaultImageDirective } from '../directives/default-image.directive';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, DefaultImageDirective],
  templateUrl: './nav.component.html'
})
export class NavComponent {

  authService: AuthService = inject(AuthService);

  logout(){
    this.authService.logout();
  }

}