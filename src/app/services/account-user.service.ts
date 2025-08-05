import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { AccountUserModel } from '../models/account_user.model';

@Injectable({
  providedIn: 'root'
})
export class AccountUserService {
  private readonly API_URL = `${environment.apiUrl}/account-user`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAccountUser(accountId: string): Observable<AccountUserModel> {
    return this.http.get<AccountUserModel>(`${this.API_URL}/${accountId}`);
  }

  updateAccountUser(accountUserModel: AccountUserModel): Observable<AccountUserModel> {
    const accountUserId = this.authService.getAccountUserId();
    return this.http.put<AccountUserModel>(this.API_URL, {
      ...accountUserModel,
      id: accountUserId,
    }).pipe(tap((res: any) => {
      return res;
    }));
  }
}
