import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

import { TrialUtilsService, ValidateUserService } from '../services/utils';
import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';
import { AccountUserService } from '../services/account-user.service';
import { ConfirmationDialogService } from '../shared/components/confirmation-dialog/confirmation-dialog.service';

@Injectable({
  providedIn: 'root'
})
export class TrialStatusGuard implements CanActivate {

  constructor(
    private router: Router,
    private trialUtils: TrialUtilsService,
    private validateUser: ValidateUserService,
    private authService: AuthService,
    private accountService: AccountService,
    private accountUserService: AccountUserService,
    private confirmationDialog: ConfirmationDialogService
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {

    // Verifica se o usuário está logado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return of(false);
    }

    // Obtém os dados da conta e verifica o status do trial
    return this.accountService.$accountData.pipe(
      switchMap(account => {
        if (!account) {
          this.router.navigate(['/login']);
          return of(false);
        }

        // Se não for trial ou já for assinante, permite acesso
        if (!account.is_trial || account.is_assinant) {
          return of(true);
        }

        // Verifica se o trial expirou
        const trialDays = this.trialUtils.calculateTrialDays(account.created_at);
        if (trialDays > 0) {
          return of(true); // Trial ainda válido
        }

        // Trial expirado - verifica o tipo de usuário
        return this.accountUserService.getAccountUser().pipe(
          map(accountUser => {
            if (!accountUser) {
              this.router.navigate(['/login']);
              return false;
            }

            if (this.validateUser.isOwnerOrManager(accountUser.type)) {
              // Owner/Manager pode acessar apenas planos e financeiro
              // Redireciona para checkout se tentar acessar outras rotas
              this.router.navigate(['/checkout']);
              return false;
            } else {
              // Usuário comum não pode acessar nada - mostra modal
              this.showTrialExpiredModal();
              return false;
            }
          })
        );
      }),
      catchError(error => {
        console.error('Erro ao verificar status do trial:', error);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }

  /**
   * Mostra modal informando que o trial expirou
   */
  private showTrialExpiredModal(): void {
    this.confirmationDialog.openInfo({
      title: 'Período de Teste Expirado',
      message: 'Seu período de teste expirou. Entre em contato com o administrador da conta para renovar o plano.',
      confirmText: 'Entendi'
    }).subscribe(() => {
      this.authService.logout();
      this.router.navigate(['/login']);
    });
  }
}
