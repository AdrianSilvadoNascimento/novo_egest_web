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

  constructor(private http: HttpClient, private router: Router) { }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');

    return !!token && token.trim() !== ''
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
    }).pipe((tap((res: any) => {
      this.setCache(res['token']);
    })))
  }

  register(registerModel: RegisterModel): Observable<any> {
    return this.http.post(this.API_URL + '/register', registerModel, {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  setCache(token: string): void {
    localStorage.setItem('token', token);
  }

  logout(): void {
    this.setLoginStatus(false);
    this.router.navigate(['/login']);
  }
}
