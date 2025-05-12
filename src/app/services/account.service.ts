import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { AccountModel } from '../models/account.model';
import { Observable, tap } from 'rxjs';
import { AccountAddressModel } from '../models/account_address.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly API_URL = `${environment.apiUrl}/account`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  updateAccount(accountModel: AccountModel): Observable<AccountModel> {
    const accountId = this.authService.getAccountId();
    return this.http.put<AccountModel>(this.API_URL, {
      ...accountModel,
      account_id: accountId,
    }).pipe(tap((res: any) => {
      return res
    }))
  }

  updateAccountAddress(accountAddressModel: AccountAddressModel): Observable<AccountAddressModel> {
    const accountId = this.authService.getAccountId();
    return this.http.put<AccountAddressModel>(this.API_URL, {
      ...accountAddressModel,
      account_id: accountId,
    }).pipe(tap((res: any) => {
      return res
    }))
  }
}
