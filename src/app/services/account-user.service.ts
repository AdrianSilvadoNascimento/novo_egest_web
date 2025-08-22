import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { AccountUserModel } from '../models/account_user.model';

@Injectable({
  providedIn: 'root'
})
export class AccountUserService {
  private readonly API_URL = `${environment.apiUrl}/account-user`;
  private headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  private accountUserData = new BehaviorSubject<AccountUserModel>({} as AccountUserModel);
  $accountUserData = this.accountUserData.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  setAccountUserData(user: AccountUserModel): void {
    this.accountUserData.next(user);
    sessionStorage.setItem('account_user_data', JSON.stringify(user))
  }

  getAccountUser(): Observable<AccountUserModel> {
    const accountUserData = sessionStorage.getItem('account_user_data');

    if (accountUserData) {
      return of(JSON.parse(accountUserData));
    }
    
    const accountId = this.authService.getAccountId();

    this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    
    return this.http.get<AccountUserModel>(`${this.API_URL}/${accountId}`, { headers: this.headers }).pipe(
      tap(res => this.setAccountUserData(res))
    )
  }

  updateAccountUser(accountUserModel: AccountUserModel): Observable<AccountUserModel> {
    const accountUserId = this.authService.getAccountUserId();
    
    this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);

    return this.http.put<AccountUserModel>(this.API_URL, {
      ...accountUserModel,
      id: accountUserId,
    }, { headers: this.headers }).pipe(tap((res: any) => {
      return res;
    }));
  }
}
