import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthGuard } from './auth/auth.guard';
import { PasswordSetupGuard } from './auth/password-setup.guard';
import { PasswordConfirmationGuard } from './auth/password-confirmation.guard';
import { TrialStatusGuard } from './guards';
import { ProductsComponent } from './components/products/products.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { AccountSettingsPageComponent } from './components/account_settings_page/account_settings_page.component';
import { CustomerComponent } from './components/customer/customer.component';
import { MovementationComponent } from './components/movementation/movementation.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { FinancialComponent } from './components/financial/financial.component';
import { TeamComponent } from './components/team/team.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { 
    path: 'home', 
    loadChildren: () => import('./components/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard, PasswordConfirmationGuard, TrialStatusGuard] 
  },
  { path: 'products', component: ProductsComponent, canActivate: [AuthGuard, PasswordConfirmationGuard, TrialStatusGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [AuthGuard, PasswordConfirmationGuard, TrialStatusGuard] },
  { path: 'movementations', component: MovementationComponent, canActivate: [AuthGuard, PasswordConfirmationGuard, TrialStatusGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard, PasswordConfirmationGuard] },
  { path: 'settings/account', component: AccountSettingsPageComponent, canActivate: [AuthGuard, PasswordConfirmationGuard, TrialStatusGuard] },
  { path: 'settings/account/:id', component: AccountSettingsPageComponent, canActivate: [AuthGuard, PasswordConfirmationGuard, TrialStatusGuard] },
  { path: 'customers', component: CustomerComponent, canActivate: [AuthGuard, PasswordConfirmationGuard, TrialStatusGuard] },
  { path: 'financial', component: FinancialComponent, canActivate: [AuthGuard, PasswordConfirmationGuard] },
  { path: 'team', component: TeamComponent, canActivate: [AuthGuard, PasswordConfirmationGuard, TrialStatusGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'auth/password-setup', 
    loadChildren: () => import('./auth/password-setup/password-setup.module').then(m => m.PasswordSetupModule),
    canActivate: [AuthGuard, PasswordSetupGuard]
  },
  { path: '**', redirectTo: 'home' },
];
