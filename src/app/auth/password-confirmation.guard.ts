import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, tap, combineLatest } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PasswordConfirmationGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Verificar se o usuário está logado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return new Observable(observer => observer.next(false));
    }

    // Verificar se o usuário precisa confirmar a senha
    // Usuário pode acessar rotas normais se:
    // - firstAccess é false (já configurou conta) OU
    // - password_confirmed é true (já confirmou senha)
    return combineLatest([
      this.authService.$firstAccess,
      this.authService.$passwordConfirmed
    ]).pipe(
      map(([firstAccess, passwordConfirmed]) => {
        // Se firstAccess é true E password_confirmed é false, 
        // usuário precisa ir para setup-password
        if (firstAccess && !passwordConfirmed) {
          this.router.navigate(['/auth/password-setup']);
          return false;
        }
        
        // Usuário pode acessar rotas normais
        return true;
      }),
      tap(canAccess => {
        if (!canAccess) {
          console.log('Usuário precisa confirmar senha antes de acessar outras rotas');
        }
      })
    );
  }
}
