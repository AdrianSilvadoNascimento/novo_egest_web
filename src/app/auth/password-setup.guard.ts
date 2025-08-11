import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, tap, combineLatest } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PasswordSetupGuard implements CanActivate {
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
    // Usuário só pode acessar setup-password se:
    // - firstAccess é true (precisa configurar conta) E
    // - password_confirmed é false (não confirmou senha)
    return combineLatest([
      this.authService.$firstAccess,
      this.authService.$passwordConfirmed
    ]).pipe(
      map(([firstAccess, passwordConfirmed]) => {
        // Se firstAccess é false OU password_confirmed é true,
        // usuário não deve acessar setup-password
        if (!firstAccess || passwordConfirmed) {
          // Usuário já configurou a conta, redirecionar para home
          this.router.navigate(['/home']);
          return false;
        }
        
        // Usuário precisa configurar a conta, permitir acesso
        return true;
      }),
      tap(canAccess => {
        if (!canAccess) {
          console.log('Usuário não pode acessar setup-password');
        }
      })
    );
  }
}
