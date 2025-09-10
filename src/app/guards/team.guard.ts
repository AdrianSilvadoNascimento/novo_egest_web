import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, map, Observable, of, switchMap } from 'rxjs';

import { AccountService } from '../services/account.service';
import { AuthService } from '../services/auth.service';
import { ValidateUserService } from '../services/utils/validate-user.service';
import { AccountUserService } from '../services/account-user.service';
import { AccountUserModel } from '../models/account_user.model';

@Injectable({
  providedIn: 'root',
})
export class TeamGuard implements CanActivate {

  constructor(
    private readonly router: Router,
    private readonly accountService: AccountService,
    private readonly accountUserService: AccountUserService,
    private readonly authService: AuthService,
    private readonly validateUser: ValidateUserService
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return of(false);
    }

    return this.accountService.$accountData.pipe(
      switchMap(account => {
        if (!account) {
          this.router.navigate(['/login']);
          return of(false);
        }

        return this.accountUserService.getAccountUser().pipe(
          map(accountUser => {
            if (!accountUser) {
              this.router.navigate(['/login']);
              return false;
            }

            if (!account.subscription.plan.features.team_features.enabled) {
              if (this.validateUser.isOwnerOrManager(accountUser.type)) {
                this.router.navigate(['/checkout']);
                return false;
              }

              this.router.navigate(['/home']);
              return false;
            }

            return true;
          })
        );
      }),
      catchError(error => {
        console.error('Erro ao verificar:', error);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
