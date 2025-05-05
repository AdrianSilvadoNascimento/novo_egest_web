// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, tap, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    if (this.authService.isLoggedIn()) {
      return this.authService.validateOrRefreshToken().pipe(
        tap(isValid => {
          if (!isValid) {
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: state.url }
            });
          }
        })
      );
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    }
  }
}
