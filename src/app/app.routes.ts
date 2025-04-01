import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { loginGuard } from './shared/guards/login.guard';
import { redirectIfLoggedGuard } from './shared/guards/redirect-if-logged.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [redirectIfLoggedGuard]
    }
];
