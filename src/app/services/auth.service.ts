import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, finalize, map, Observable, of, shareReplay, Subject, switchMap, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { LoginModel } from '../models/login.model';
import { RegisterModel } from '../models/register.model';
import { RefreshToken } from './utils/gateways/refresh-auth-token-gateway.service';
import { AccountUserModel } from '../models/account_user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;

  private toggleLogin = new BehaviorSubject<boolean>(this.isLoggedIn());
  $toggleLogin = this.toggleLogin.asObservable();

  private registeredEmail = new BehaviorSubject<string>('');
  $registeredEmail = this.registeredEmail.asObservable();

  private firstAccess = new BehaviorSubject<boolean>(false);
  $firstAccess = this.firstAccess.asObservable();

  private passwordConfirmed = new BehaviorSubject<boolean>(true);
  $passwordConfirmed = this.passwordConfirmed.asObservable();

  private storage: Storage = localStorage;
  tokenTimer: any;
  refreshInProgress = false;
  refreshSubject = new Subject<boolean>();

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  isLoggedIn(): boolean {
    const token = this.getToken();

    return !!token && token.trim() !== ''
  }

  setEmail(email: string): void {
    this.registeredEmail.next(email);
  }

  setFirstAccess(status: boolean): void {
    this.firstAccess.next(status);
  }

  setPasswordConfirmed(status: boolean): void {
    this.passwordConfirmed.next(status);
  }

  isPasswordConfirmed(): boolean {
    return this.passwordConfirmed.value;
  }

  /**
   * Redireciona o usuário para a rota correta baseado nas flags
   */
  redirectBasedOnFlags(): void {
    const firstAccess = this.firstAccess.value;
    const passwordConfirmed = this.passwordConfirmed.value;

    if (firstAccess && !passwordConfirmed) {
      this.router.navigate(['/auth/password-setup']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  /**
   * Define o status de login e o token
   * @param status - true se o usuário está logado, false caso contrário
   * @param token - token de autenticação (opcional)
   */
  setLoginStatus(status: boolean, token?: string): void {
    if (status && token) {
      this.storage.setItem('token', token);
    } else if (!status) {
      this.storage.removeItem('token');
    }

    this.toggleLogin.next(status);
  }

  /**
   * Realiza o login do usuário
   * @param loginModel - Modelo de login
   * @returns Observable com o resultado do login
   */
  login(loginModel: LoginModel): Observable<any> {
    const url = `${this.API_URL}/login`
    return this.http.post(url, loginModel, {
      headers: { 'Content-Type': 'application/json' },
    }).pipe(
      tap(async (res: any) => {
        this.storage = sessionStorage;

        this.setCache({
          token: res.token,
          refresh_token: res.refresh_token,
          account_id: res.account_id,
          user_id: res.account_user.id,
          user_image: res.account_user.user_image,
        });
        this.setLoginStatus(true, res.token);
        this.firstAccess.next(res.account_user.first_access);
        this.setPasswordConfirmed(res.account_user.password_confirmed || true);

        this.redirectBasedOnFlags();
      })
    )
  }

  validateOrRefreshToken(): Observable<boolean> {
    const token = this.getToken();
    const refreshToken = localStorage.getItem('refresh_token');

    if (!token) {
      return of(false);
    }

    return this.http.post<{ valid: boolean }>(`${this.API_URL}/validate-token`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).pipe(
      switchMap(response => {
        if (response.valid) {
          return of(true);
        } else if (refreshToken) {
          return this.refreshToken().pipe(
            map(() => true),
            catchError(() => {
              this.setLoginStatus(false);
              return of(false);
            })
          );
        } else {
          this.setLoginStatus(false);
          return of(false);
        }
      }),
      catchError(() => {
        if (refreshToken) {
          return this.refreshToken().pipe(
            map(() => true),
            catchError(() => {
              this.setLoginStatus(false);
              return of(false);
            })
          );
        }
        this.setLoginStatus(false);
        return of(false);
      })
    );
  }

  refreshToken(): Observable<string> {
    const currentAccountUser = JSON.parse(this.storage.getItem('account_user_data')!!);

    if (!currentAccountUser?.refresh_token) {
      return of('').pipe(
        tap(() => {
          this.setLoginStatus(false);
          this.router.navigate(['/login']);
        })
      );
    }

    return this.http.post<{ token: string, refreshToken?: string }>(`${this.API_URL}/refresh-token?user-id=${currentAccountUser.id}`, {}, {
      headers: { 'Authorization': `Bearer ${currentAccountUser.refresh_token}` }
    }).pipe(
      tap(response => {
        if (response.token) {
          this.setLoginStatus(true, response.token);
        } else {
          this.setLoginStatus(false);
        }
      }),
      map(response => response.token),
      catchError(error => {
        console.error('Erro ao atualizar token:', error);
        this.setLoginStatus(false);
        this.router.navigate(['/login']);
        return of('');
      })
    );
  }

  forceRefreshToken(): Observable<{ token: string; expiresIn: number }> {
    const currentAccountUser = JSON.parse(sessionStorage.getItem('account_user_data') || 'null');
    const token = sessionStorage.getItem('token')!!

    if (!token) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }

    const apiUrl = `${this.API_URL}/refresh-token?user-id=${currentAccountUser.id}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Skip-Loading': 'true'
    });

    if (this.refreshInProgress) {
      return this.refreshSubject.asObservable().pipe(
        shareReplay(1)
      ) as unknown as Observable<{ token: string; expiresIn: number }>;
    }

    this.refreshInProgress = true;

    return this.http.post<{ token: string; expiresIn: number }>(apiUrl, {}, { headers }).pipe(
      tap((res) => {
        console.log("RETORNO ", res);
        this.updateAuthToken(res);
        currentAccountUser.token = res.token;

        const expiresInDuration = res.expiresIn;
        const descountedTimer = expiresInDuration - expiresInDuration * 0.2;
        const now = Date.now();
        const expirationDate = new Date(now + descountedTimer * 1000);
        this.setAuthTimer(expiresInDuration, currentAccountUser);
        this.setTokenExpiration(expirationDate);
      }),
      catchError((err) => {
        console.error('Refresh token falhou', err);
        this.logout();
        return throwError(() => err);
      }),
      finalize(() => {
        this.refreshInProgress = false;
        this.refreshSubject.next(true);
      }),
      shareReplay(1)
    );
  }

  /**
   * Atualiza o auth token no cache do client
   * @param data RefreshToken 
   */
  updateAuthToken(data: RefreshToken): void {
    console.log("ATUALIZOU O TOKEN:", data)
    if (!data.token) {
      this.logout();
      return;
    }

    this.setLoginStatus(true, data.token);
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getAccountId(): string | null {
    return sessionStorage.getItem('account_id');
  }

  getAccountUserId(): string | null {
    return sessionStorage.getItem('user_id');
  }

  rememberMe(): boolean {
    const accountUser = JSON.parse(sessionStorage.getItem('account_user_data')!!)
    let rememberMe = false;

    if (accountUser) rememberMe = accountUser.remember_me;
    return rememberMe;
  }

  /**
   * Registra um usuário
   * @param registerModel - Modelo de registro
   * @returns Observable com o resultado do registro
   */
  register(registerModel: RegisterModel): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, registerModel, {
      headers: { 'Content-Type': 'application/json' },
    }).pipe((tap((res: any) => {
      this.setEmail(registerModel.email);
      this.router.navigate(['/login'])
    })))
  }

  /**
   * Registra um usuário com Google
   * @param googleRegisterData - Dados do registro com Google
   * @returns Observable com o resultado do registro
   */
  registerWithGoogle(googleRegisterData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register/google`, googleRegisterData, {
      headers: { 'Content-Type': 'application/json' },
    }).pipe(
      tap((res: any) => {
        this.setCache({
          token: res.token,
          refresh_token: res.refresh_token,
          account_id: res.account_id,
          user_id: res.account_user.id,
          user_image: res.account_user.user_image,
        });
        this.setLoginStatus(true, res.token);
        this.firstAccess.next(res.account_user.first_access);
        this.setPasswordConfirmed(false);
        this.redirectBasedOnFlags();
      })
    );
  }

  loginWithGoogle(googleLoginData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/login/google`, googleLoginData, {
      headers: { 'Content-Type': 'application/json' },
    }).pipe(
      tap(async (res: any) => {
        this.storage = sessionStorage;
        this.setCache({
          token: res.token,
          refresh_token: res.refresh_token,
          account_id: res.account_id,
          user_id: res.account_user.id,
          user_image: res.account_user.user_image,
        });
        this.setLoginStatus(true, res.token);
        this.firstAccess.next(res.account_user.first_access);
        this.setPasswordConfirmed(res.account_user.password_confirmed || false);

        this.redirectBasedOnFlags();
      })
    )
  }

  updateAccountUserPassword(password: string): Observable<any> {
    const accountUserId = this.getAccountUserId();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    }

    return this.http.post(`${this.API_URL}/update-password`, { accountUserId, password }, { headers })
      .pipe(
        tap((res: any) => {
          this.setPasswordConfirmed(true);
          this.setFirstAccess(false);
        })
      );
  }

  setTokenExpiration(expiresIn: Date) {
    localStorage.setItem('expiration', expiresIn.toISOString())
  }

  setCache(res: {
    token: string,
    refresh_token: string,
    account_id: string,
    user_id: string,
    user_image: string,
  }): void {
    localStorage.setItem('refresh_token', res.refresh_token);
    this.storage.setItem('token', res.token);
    this.storage.setItem('account_id', res.account_id);
    this.storage.setItem('user_id', res.user_id);
    this.storage.setItem('user_image', res.user_image);

    const passwordConfirmed = this.storage.getItem('password_confirmed');
    if (passwordConfirmed !== null) {
      this.setPasswordConfirmed(passwordConfirmed === 'true');
    }
  }

  clearCache(): void {
    sessionStorage.clear();
    localStorage.clear();
  }

  async logout(): Promise<void> {
    this.setLoginStatus(false);
    this.setFirstAccess(false);
    this.setPasswordConfirmed(true);
    this.clearCache();
    clearTimeout(this.tokenTimer);

    this.router.navigate(['/login']);
  }

  setAuthTimer(timer: number, accountUser: AccountUserModel): void {
    const now = new Date();
    const expirationDate = new Date(now.getTime() + timer * 1000);
    this.setTokenExpiration(expirationDate);
    
    let isToLogout = true
    let expireToken = timer;

    if (accountUser && accountUser.remember_me) {
      isToLogout = false;
      expireToken = timer - (timer * 0.4);
    }


    clearTimeout(this.tokenTimer);
    this.tokenTimer = setTimeout(() => {
      const token = sessionStorage.getItem('token')!!;
      if (!token) {
        this.logout();
        return;
      }

      if (isToLogout) {
        this.logout();
        return;
      }

      this.forceRefreshToken().subscribe({
        next: () => { },
        error: (err) => { console.error('Erro no refresh por timer', err); }
      });
    }, expireToken * 1000);
  }
}
