import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { AccountModel } from '../models/account.model';
import { AccountAddressModel } from '../models/account_address.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly API_URL = `${environment.apiUrl}/account`;

  private accountData = new BehaviorSubject<AccountModel>({} as AccountModel);
  $accountData = this.accountData.asObservable();

  private accountAddressData = new BehaviorSubject<AccountAddressModel>({} as AccountAddressModel);
  $accountAddressData = this.accountAddressData.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Define os dados da conta
   * @param account - Os dados da conta
   */
  setAccountData(account: AccountModel): void {
    this.accountData.next(account);
    sessionStorage.setItem('account', JSON.stringify(account))
  }

  /**
   * Define os dados do endereço da conta
   * @param address - Os dados do endereço da conta
   */
  setAccountAddressData(address: AccountAddressModel): void {
    this.accountAddressData.next(address);
    sessionStorage.setItem('account_address', JSON.stringify(address))
  }

  /**
   * Atualiza os dados da conta
   * @param accountModel - Os dados da conta
   * @returns Os dados da conta atualizados
   */
  updateAccount(accountModel: AccountModel): Observable<AccountModel> {
    const accountId = this.authService.getAccountId();
    const accountUserId = this.authService.getAccountUserId();
    return this.http.put<AccountModel>(this.API_URL, {
      ...accountModel,
      account_id: accountId,
      account_user_id: accountUserId,
    }).pipe(tap(() => this.getAccount()))
  }

  /**
   * Obtém os dados da conta
   * @returns Os dados da conta
   */
  getAccount(): Observable<AccountModel> {
    const accountData = sessionStorage.getItem('account_data');

    if (accountData) {
      return of(JSON.parse(accountData));
    }

    const accountId = this.authService.getAccountId()
    return this.http.get<AccountModel>(`${this.API_URL}/${accountId}`).pipe(
      tap(res => this.setAccountData(res))
    )
  }

  /**
   * Obtém os dados do endereço da conta
   * @returns Os dados do endereço da conta
   */
  getAccountAddress(): Observable<AccountAddressModel> {
    const accountId = this.authService.getAccountId();
    return this.http.get<AccountAddressModel>(`${this.API_URL}/${accountId}/address`).pipe(
      tap(res => this.setAccountAddressData(res))
    )
  }

  /**
   * Atualiza os dados do endereço da conta
   * @param accountAddressModel - Os dados do endereço da conta
   * @returns Os dados do endereço da conta atualizados
   */
  updateAccountAddress(accountAddressModel: AccountAddressModel): Observable<AccountAddressModel> {
    const accountId = this.authService.getAccountId();
    return this.http.put<AccountAddressModel>(`${this.API_URL}/address`, {
      ...accountAddressModel,
      account_id: accountId,
    }).pipe(tap(res => this.setAccountAddressData(res)))
  }
}
