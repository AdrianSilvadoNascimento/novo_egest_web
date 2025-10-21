import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { AccountUserModel } from '../models/account_user.model';
import { UtilsService } from './utils/utils.service';

@Injectable({
  providedIn: 'root'
})
export class AccountUserService {
  private readonly API_URL = `${environment.apiUrl}/account-user`;

  private accountUserData: BehaviorSubject<AccountUserModel>
  $accountUserData: Observable<AccountUserModel>;

  constructor(private http: HttpClient, private authService: AuthService, private utilsService: UtilsService) {
    const storedAccountUserData = sessionStorage.getItem('account_user_data');
    const parsedAccountUserData = storedAccountUserData ? JSON.parse(storedAccountUserData) : ({} as AccountUserModel);

    this.accountUserData = new BehaviorSubject<AccountUserModel>(parsedAccountUserData);
    this.$accountUserData = this.accountUserData.asObservable();
  }

  /**
   * Define os dados do usuário
   * @param user - Dados do usuário
   */
  setAccountUserData(user: AccountUserModel): void {
    this.accountUserData.next(user);
    sessionStorage.setItem('account_user_data', JSON.stringify(user))
  }

  /**
   * Obtém os dados do usuário
   * @returns Observable com os dados do usuário
   */
  getAccountUser(accountUserId: string = ''): Observable<AccountUserModel> {
    if (accountUserId === '') {
      accountUserId = this.authService.getAccountUserId()!;
    }

    return this.http.get<AccountUserModel>(`${this.API_URL}/${accountUserId}`, { headers: this.utilsService.withAuth() }).pipe(
      tap(res => this.setAccountUserData(res))
    )
  }

  /**
   * Atualiza os dados do usuário
   * @param accountUserModel - Dados do usuário
   * @returns Observable com os dados do usuário atualizados
   */
  updateAccountUser(accountUserModel: AccountUserModel): Observable<AccountUserModel> {
    const accountUserId = this.authService.getAccountUserId();

    return this.http.put<AccountUserModel>(this.API_URL, {
      ...accountUserModel,
      id: accountUserId,
    }, { headers: this.utilsService.withAuth() }).pipe(tap((res: any) => {
      return res;
    }));
  }
}
