import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, from, Observable, switchMap, tap } from 'rxjs';
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
      console.log('LoginModel', loginModel);
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
        this.router.navigate(['/home']);
      })
    );
  }

  refreshToken(): Observable<string> {
    const refreshToken = this.storage.getItem('refreshToken');

    return this.http.post<{ token: string }>(this.API_URL + '/refresh-token', {}, {
      headers: { 'Authorization': `Bearer ${refreshToken}` }
    }).pipe(
      tap((response: any) => {
        this.setLoginStatus(true, response.token);

        this.storage.setItem('token', response.token);
      }),
      switchMap((response: any) => {
        return from([response.token]);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  getAccountId(): string | null {
    return localStorage.getItem('account_id') || sessionStorage.getItem('account_id');
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
    this.storage.removeItem('refresh_token');
    this.setAccountUserName('');
    this.router.navigate(['/login']);
  }
}
