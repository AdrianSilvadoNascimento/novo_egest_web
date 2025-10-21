import { Injectable } from '@angular/core';
import { AccountService } from '../account.service';
import { AccountUserService } from '../account-user.service';
import { AuthService } from '../auth.service';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { AccountUserModel } from '../../models/account_user.model';
import { AccountModel } from '../../models/account.model';

@Injectable({
  providedIn: 'root'
})
export class UtilsAuthService {
  private readonly TTL_MS = 2 * 60 * 1000;
  private readonly ACCOUNT_KEY = 'account_data';
  private readonly ACCOUNT_TS_KEY = 'account_data_ts';
  private readonly ACCOUNT_USER_KEY = 'account_user_data';
  private readonly ACCOUNT_USER_TS_KEY = 'account_user_data_ts';

  private currentAccountData: BehaviorSubject<AccountModel>
  $currentAccountData: Observable<AccountModel>;

  private currentAccountUserData: BehaviorSubject<AccountUserModel>;
  $currentAccountUserData: Observable<AccountUserModel>;

  private isLogged: boolean = false;

  constructor(
    private readonly accountService: AccountService,
    private readonly accountUserService: AccountUserService,
    private readonly authService: AuthService
  ) {
    this.authService.$toggleLogin.subscribe((isLogged) => {
      this.isLogged = isLogged;
    })

    const storedAccountUserData = sessionStorage.getItem(this.ACCOUNT_USER_KEY);
    const parsedAccountUserData = storedAccountUserData ? JSON.parse(storedAccountUserData) : ({} as AccountUserModel);
    this.currentAccountUserData = new BehaviorSubject<AccountUserModel>(parsedAccountUserData);
    this.$currentAccountUserData = this.currentAccountUserData.asObservable();

    const storedAccountData = sessionStorage.getItem(this.ACCOUNT_KEY);
    const parsedAccountData = storedAccountData ? JSON.parse(storedAccountData) : ({} as AccountModel);
    this.currentAccountData = new BehaviorSubject<AccountModel>(parsedAccountData);
    this.$currentAccountData = this.currentAccountData.asObservable();

    if (this.hasCachedAccount() && this.isExpired(this.ACCOUNT_TS_KEY)) {
      this.fetchAndUpdateAccountData().subscribe({ error: () => { } });
    }

    if (this.hasCachedAccountUser() && this.isExpired(this.ACCOUNT_USER_TS_KEY)) {
      this.fetchAndUpdateAccountUserData().subscribe({ error: () => { } })
    }
  }

  /**
   * Seta as informações de conta user do usuário atual
   * @param data - Dados do usuário
   */
  setAccountUserData(data: AccountUserModel): void {
    this.currentAccountUserData.next(data);
    this.setWithTimestamp(this.ACCOUNT_USER_KEY, this.ACCOUNT_USER_TS_KEY, data);
  }

  /**
   * Seta as informações da conta do usuário atual
   * @param data - Dados da conta
   */
  setAccountData(data: AccountModel): void {
    this.currentAccountData.next(data);
    this.setWithTimestamp(this.ACCOUNT_KEY, this.ACCOUNT_TS_KEY, data);
  }

  currentAccount(): Observable<AccountModel> {
    if (!this.isLogged) return this.$currentAccountData;

    if (!this.hasCachedAccount()) {
      this.fetchAndUpdateAccountData().subscribe({ error: () => { } });
      return this.$currentAccountData;
    }

    if (this.isExpired(this.ACCOUNT_TS_KEY)) {
      this.fetchAndUpdateAccountData().subscribe({ error: () => { } });
    }

    return this.$currentAccountData;
  }

  currentAccountUser(): Observable<AccountUserModel> {
    if (!this.isLogged) return this.$currentAccountUserData;

    if (!this.hasCachedAccountUser()) {
      this.fetchAndUpdateAccountUserData().subscribe({ error: () => { } });
      return this.$currentAccountUserData;
    }

    if (this.isExpired(this.ACCOUNT_USER_TS_KEY)) {
      this.fetchAndUpdateAccountUserData().subscribe({ error: () => { } });
    }

    return this.$currentAccountUserData;
  }

  fetchAndUpdateAccountData(): Observable<AccountModel> {
    return this.accountService.getAccount().pipe(
      tap((account) => {
        if (account) {
          this.setAccountData(account);
        }
      }),
      catchError((err) => {
        console.error('Erro ao buscar account no servidor', err);
        return of(this.currentAccountData.value);
      })
    );
  }

  fetchAndUpdateAccountUserData(): Observable<AccountUserModel> {
    return this.accountUserService.getAccountUser().pipe(
      tap((accountUser) => {
        if (accountUser) {
          this.setAccountUserData(accountUser);
        }
      }),
      catchError((err) => {
        console.error('Erro ao buscar account no servidor', err);
        return of(this.currentAccountUserData.value);
      })
    );
  }

  private setWithTimestamp(key: string, tsKey: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
    sessionStorage.setItem(tsKey, String(Date.now()));
  }

  private getTimestamp(tsKey: string): number | null {
    const timestamp = sessionStorage.getItem(tsKey);

    if (!timestamp) return null;

    const number = Number(timestamp);
    return Number.isNaN(number) ? null : number;
  }

  private isExpired(tsKey: string): boolean {
    const timestamp = this.getTimestamp(tsKey);
    if (!timestamp) return true;
    return (Date.now() - timestamp) > this.TTL_MS;
  }

  private hasCachedAccount(): boolean {
    return !!sessionStorage.getItem(this.ACCOUNT_KEY);
  }

  private hasCachedAccountUser(): boolean {
    return !!sessionStorage.getItem(this.ACCOUNT_USER_KEY);
  }

  clearCache(): void {
    sessionStorage.removeItem(this.ACCOUNT_KEY);
    sessionStorage.removeItem(this.ACCOUNT_TS_KEY);
    sessionStorage.removeItem(this.ACCOUNT_USER_KEY);
    sessionStorage.removeItem(this.ACCOUNT_USER_TS_KEY);
    this.currentAccountData.next({} as AccountModel);
    this.currentAccountUserData.next({} as AccountUserModel);
  }
}
