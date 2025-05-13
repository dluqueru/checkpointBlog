import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { loginGuard } from './shared/guards/login.guard';
import { redirectIfLoggedGuard } from './shared/guards/redirect-if-logged.guard';
import { RegisterComponent } from './auth/register/register.component';
import { ListComponent } from './articles/list/list.component';
import { ArticleComponent } from './articles/article/article.component';
import { ProfileComponent } from './user/profile/profile.component';

export const routes: Routes = [
    {
        path: '',
        component: ListComponent
    },
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [redirectIfLoggedGuard]
    },
    {
        path: 'register',
        component: RegisterComponent,
        canActivate: [redirectIfLoggedGuard]
    },
    {
        path: 'article/:articleId',
        component: ArticleComponent,
        canActivate: [loginGuard]
    },
    {
        path: 'user/:username',
        component: ProfileComponent,
        canActivate: [loginGuard]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
