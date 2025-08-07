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
    this.userName.next(userName);
    this.storage.setItem('userName', userName);
  }

  setEmail(email: string): void {
    this.registeredEmail.next(email);
  }

  setFirstAccess(status: boolean): void {
    this.firstAccess.next(status);
  }

  setLoginStatus(status: boolean, token?: string): void {
    if (status && token) {
      this.storage.setItem('token', token);
    } else if (!status) {
      this.storage.removeItem('token');
    }

    this.toggleLogin.next(status);
  }

  login(loginModel: LoginModel): Observable<any> {
    if (loginModel.remember) {
      localStorage.setItem('remember_me', 'true');
      this.storage = localStorage;
    } else {
      localStorage.setItem('remember_me', 'false');
      this.storage = sessionStorage;
    }

    return this.http.post(this.API_URL + '/login', loginModel, {
      headers: { 'Content-Type': 'application/json' },
    }).pipe(
      tap((res: any) => {
        const token = res.token;
        const account_user = res.account_user;
        this.setCache({
          token: token,
          refresh_token: res.refresh_token,
          account_id: res.account_id,
          user_id: account_user.id,
        });
        this.setAccountUserName(account_user.name);
        this.setLoginStatus(true, token);
        this.firstAccess.next(account_user.first_access);
        this.router.navigate(['/home']);
      })
    );
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

  setCache(res: {
    token: string,
    refresh_token: string,
    account_id: string,
    user_id: string,
  }): void {
    localStorage.setItem('refresh_token', res.refresh_token);
    this.storage.setItem('token', res.token);
    this.storage.setItem('account_id', res.account_id);
    this.storage.setItem('user_id', res.user_id);
  }

  clearCache(): void {
    this.storage.removeItem('token');
    this.storage.removeItem('account_id');
    this.storage.removeItem('user_id');
  }

  logout(): void {
    this.setLoginStatus(false);
    this.clearCache();
    localStorage.removeItem('refresh_token');
    this.setAccountUserName('');
    this.router.navigate(['/login']);
  }
}
