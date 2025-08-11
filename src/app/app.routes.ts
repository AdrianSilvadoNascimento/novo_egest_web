import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthGuard } from './auth/auth.guard';
import { PasswordSetupGuard } from './auth/password-setup.guard';
import { PasswordConfirmationGuard } from './auth/password-confirmation.guard';
import { ProductsComponent } from './components/products/products.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { AccountSettingsPageComponent } from './components/account_settings_page/account_settings_page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { 
    path: 'home', 
    loadChildren: () => import('./components/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard, PasswordConfirmationGuard] 
  },
  { path: 'products', component: ProductsComponent, canActivate: [AuthGuard, PasswordConfirmationGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [AuthGuard, PasswordConfirmationGuard] },
  { path: 'settings/account', component: AccountSettingsPageComponent, canActivate: [AuthGuard, PasswordConfirmationGuard] },
  { path: 'settings/account/:id', component: AccountSettingsPageComponent, canActivate: [AuthGuard, PasswordConfirmationGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'auth/password-setup', 
    loadChildren: () => import('./auth/password-setup/password-setup.module').then(m => m.PasswordSetupModule),
    canActivate: [AuthGuard, PasswordSetupGuard]
  },
  { path: '**', redirectTo: 'home' },
];
