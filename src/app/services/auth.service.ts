import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { LoginModel } from '../models/login.model';
import { RegisterModel } from '../models/register.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;

  private toggleLogin = new BehaviorSubject<boolean>(this.isLoggedIn());
  $toggleLogin = this.toggleLogin.asObservable();

  private registeredEmail = new BehaviorSubject<string>('');
  $registeredEmail = this.registeredEmail.asObservable();

  private userName = new BehaviorSubject<string>(this.accountUserName());
  $userName = this.userName.asObservable();

  private firstAccess = new BehaviorSubject<boolean>(false);
  $firstAccess = this.firstAccess.asObservable();

  private passwordConfirmed = new BehaviorSubject<boolean>(true);
  $passwordConfirmed = this.passwordConfirmed.asObservable();

  private storage: Storage = localStorage;

  constructor(private http: HttpClient, private router: Router) { }

  isLoggedIn(): boolean {
    const token = this.getToken();
    this.storage = localStorage.getItem('remember_me') === 'true' ? localStorage : sessionStorage;

    return !!token && token.trim() !== ''
  }

  accountUserName(): string {
    if (this.isLoggedIn()) {
      return this.storage.getItem('userName') || '';
    }

    return '';
  }

  setAccountUserName(userName: string): void {
    this.storage = this.rememberMe() ? localStorage : sessionStorage;
    this.storage.setItem('userName', userName);
    this.userName.next(userName);
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

    console.log('Redirecionando baseado nas flags:', { firstAccess, passwordConfirmed });

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

  login(loginModel: LoginModel): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, loginModel, {
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
        this.setAccountUserName(res.account_user.name);
        this.setLoginStatus(true, res.token);
        this.firstAccess.next(res.account_user.first_access);
        this.setPasswordConfirmed(res.account_user.password_confirmed || true);
        this.redirectBasedOnFlags();
      })
    )
  }

  validateOrRefreshToken(): Observable<boolean> {
    const token = this.getToken();
    const refreshToken = this.storage.getItem('refresh_token');

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
    const refreshToken = this.storage.getItem('refresh_token');

    if (!refreshToken) {
      return of('').pipe(
        tap(() => {
          this.setLoginStatus(false);
          this.router.navigate(['/login']);
        })
      );
    }

    return this.http.post<{ token: string, refreshToken?: string }>(`${this.API_URL}/refresh-token`, {}, {
      headers: { 'Authorization': `Bearer ${refreshToken}` }
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

  getToken(): string | null {
    return this.rememberMe() ? localStorage.getItem('refresh_token') : sessionStorage.getItem('token');
  }

  getAccountId(): string | null {
    return this.rememberMe() ? localStorage.getItem('account_id') : sessionStorage.getItem('account_id');
  }

  getAccountUserId(): string | null {
    return this.rememberMe() ? localStorage.getItem('user_id') : sessionStorage.getItem('user_id');
  }

  rememberMe(): boolean {
    const rememberMe = localStorage.getItem('remember_me')

    return rememberMe === 'true';
  }

  register(registerModel: RegisterModel): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, registerModel, {
      headers: { 'Content-Type': 'application/json' },
    }).pipe((tap((res: any) => {
      this.setEmail(registerModel.email);
      this.router.navigate(['/login'])
    })))
  }

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
        this.setAccountUserName(res.account_user.name);
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
      tap((res: any) => {
        this.setCache({
          token: res.token,
          refresh_token: res.refresh_token,
          account_id: res.account_id,
          user_id: res.account_user.id,
          user_image: res.account_user.user_image,
        });
        this.setAccountUserName(res.account_user.name);
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
          // Marcar senha como confirmada
          this.setPasswordConfirmed(true);
          // Marcar first_access como false (usuário configurou a conta)
          this.setFirstAccess(false);
        })
      );
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

    // Verificar se há dados de password_confirmed no cache
    const passwordConfirmed = this.storage.getItem('password_confirmed');
    if (passwordConfirmed !== null) {
      this.setPasswordConfirmed(passwordConfirmed === 'true');
    }
  }

  clearCache(): void {
    this.storage = this.rememberMe() ? localStorage : sessionStorage;
    
    this.storage.removeItem('token');
    this.storage.removeItem('account_id');
    this.storage.removeItem('user_id');
    this.storage.removeItem('user_image');
    this.storage.removeItem('password_confirmed');
    this.storage.removeItem('itemData');
    this.storage.removeItem('dashboardData');
    this.storage.removeItem('userName');
  }

  logout(): void {
    this.setLoginStatus(false);
    this.setFirstAccess(false);
    this.setPasswordConfirmed(true);
    this.clearCache();
    localStorage.removeItem('refresh_token');
    this.setAccountUserName('');
    this.router.navigate(['/login']);
  }
}
