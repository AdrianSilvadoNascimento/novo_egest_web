import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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

  constructor(private http: HttpClient, private router: Router) { }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');

    return !!token && token.trim() !== ''
  }

  accountUserName(): string {
    if (this.isLoggedIn()) {
      return localStorage.getItem('userName') || '';
    }

    return '';
  }

  setAccountUserName(userName: string): void {
    this.userName.next(userName);
    localStorage.setItem('userName', userName);
  }

  setEmail(email: string): void {
    this.registeredEmail.next(email);
  }

  setLoginStatus(status: boolean, token?: string): void {
    if (status && token) {
      localStorage.setItem('token', token);
    } else if (!status) {
      localStorage.removeItem('token');
    }

    this.toggleLogin.next(status);
  }

  login(loginModel: LoginModel): Observable<any> {
    return this.http.post(this.API_URL + '/login', loginModel, {
      headers: { 'Content-Type': 'application/json' },
    }).pipe(
      tap((res: any) => {
        const token = res['token'];
        const account_user = res['account_user'];
        this.setCache({ token: token, account_id: res['account_id'], user_id: account_user['id'] });
        this.setAccountUserName(account_user['name']);
        this.setLoginStatus(true, token);
        this.router.navigate(['/home']);
      })
    );
  }

  register(registerModel: RegisterModel): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, registerModel, {
      headers: { 'Content-Type': 'application/json' },
    }).pipe((tap((res: any) => {
      this.setEmail(registerModel.email);
      this.router.navigate(['/login'])
    })))
  }

  setCache(res: { token: string, account_id: string, user_id: string }): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('account_id', res.account_id);
    localStorage.setItem('user_id', res.user_id);
  }

  logout(): void {
    this.setLoginStatus(false);
    this.router.navigate(['/login']);
  }
}
