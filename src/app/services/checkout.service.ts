import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, tap, interval, Subscription } from 'rxjs';

import { PlanModel } from '../models/plan.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { SubscriptionModel } from '../models/account.model';
import { AccountUserService } from './account-user.service';
import { IdentityModel } from '../models/identity.model';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/checkout`;
  private headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  accountId!: string;

  // Dados dos planos
  private planData = new BehaviorSubject<PlanModel[]>([]);
  $planData = this.planData.asObservable();

  private subscriptionData = new BehaviorSubject<SubscriptionModel>(new SubscriptionModel());
  $subscriptionData = this.subscriptionData.asObservable();

  // Dados do plano da assinatura
  private subscriptionPlanData = new BehaviorSubject<PlanModel>(new PlanModel());
  $subscriptionPlanData = this.subscriptionPlanData.asObservable();

  // Timer para atualização automática (5 minutos)
  private refreshTimer?: Subscription;
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private accountUserService: AccountUserService
  ) {
    this.startAutoRefresh();
  }

  /**
   * Define os dados dos planos no BehaviorSubject e no sessionStorage
   * @param data - dados dos planos
   */
  setPlanData(data: PlanModel[]) {
    sessionStorage.setItem('planData', JSON.stringify(data));
    this.planData.next(data);
  }

  /**
   * Define os dados da assinatura no BehaviorSubject e no sessionStorage
   * @param data - dados da assinatura
   */
  setSubscriptionData(data: SubscriptionModel) {
    sessionStorage.setItem('subscriptionData', JSON.stringify(data));
    this.subscriptionData.next(data);
  }

  /**
   * Define os dados do plano da assinatura no BehaviorSubject e no sessionStorage
   * @param data - dados do plano da assinatura
   */
  setSubscriptionPlanData(data: PlanModel) {
    sessionStorage.setItem('subscriptionPlanData', JSON.stringify(data));
    this.subscriptionPlanData.next(data);
  }

  /**
   * Adiciona o token de autenticação ao headers
   * @param skipLoading - se o loading deve ser ignorado
   * @returns headers com o token de autenticação
   */
  private withAuth(skipLoading: boolean = false): HttpHeaders {
    this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`)

    if (skipLoading) {
      this.headers = this.headers.set('X-Skip-Loading', 'true');
    }

    return this.headers;
  }

  /**
   * Inicia o timer de atualização automática
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) return;

    this.refreshTimer = interval(this.REFRESH_INTERVAL).subscribe(() => {
      this.refreshDataSilently();
    });
  }

  /**
   * Atualiza dados silenciosamente em background
   */
  private refreshDataSilently(): void {
    const accountId = this.authService.getAccountId();
    if (!accountId) {
      return;
    }

    // Headers com flag para evitar loading global
    const silentHeaders = this.withAuth().set('X-Silent-Request', 'true');

    // Atualiza dados da assinatura (apenas em memória)
    this.http.get<SubscriptionModel>(`${this.apiUrl}/subscription/${accountId}`, {
      headers: silentHeaders
    }).subscribe({
      next: (data) => {
        // Atualiza apenas o BehaviorSubject, sem salvar no sessionStorage
        this.subscriptionData.next(data);
      },
      error: (error) => {
        console.warn('Erro ao atualizar dados da assinatura em background:', error);
      }
    });

    this.http.get<PlanModel[]>(`${this.apiUrl}/plans`, {
      headers: silentHeaders
    }).subscribe({
      next: (data) => {
        this.planData.next(data);
      },
      error: (error) => {
        console.warn('Erro ao atualizar dados dos planos em background:', error);
      }
    });

    // Atualiza dados do plano da assinatura (apenas em memória)
    this.http.get<PlanModel>(`${this.apiUrl}/subscription/plan/${accountId}`, {
      headers: silentHeaders
    }).subscribe({
      next: (data) => {
        // Atualiza apenas o BehaviorSubject, sem salvar no sessionStorage
        this.subscriptionPlanData.next(data);
      },
      error: (error) => {
        console.warn('Erro ao atualizar dados do plano em background:', error);
      }
    });
  }

  /**
   * Força atualização manual dos dados
   */
  forceRefresh(): Observable<any> {
    const accountId = this.authService.getAccountId();
    if (!accountId) {
      return of(null);
    }

    // Headers com flag para evitar loading global
    const silentHeaders = this.withAuth().set('X-Silent-Request', 'true');

    // Atualiza dados da assinatura
    const subscriptionRequest = this.http.get<SubscriptionModel>(
      `${this.apiUrl}/subscription/${accountId}`,
      { headers: silentHeaders }
    ).pipe(
      tap((data) => {
        this.setSubscriptionData(data);
      })
    );

    // Atualiza dados do plano da assinatura
    const planRequest = this.http.get<PlanModel>(
      `${this.apiUrl}/subscription/plan/${accountId}`,
      { headers: silentHeaders }
    ).pipe(
      tap((data) => {
        this.setSubscriptionPlanData(data);
      })
    );

    // Retorna um observable que combina ambas as requisições
    return new Observable(observer => {
      subscriptionRequest.subscribe({
        next: () => {
          planRequest.subscribe({
            next: () => observer.next(true),
            error: (err) => observer.error(err)
          });
        },
        error: (err) => observer.error(err)
      });
    });
  }

  /**
   * Obtém os planos
   * @returns planos
   */
  getPlans(): Observable<PlanModel[]> {
    const plans = sessionStorage.getItem('planData');
    if (plans) {
      return of(JSON.parse(plans));
    }

    return this.http.get<PlanModel[]>(`${this.apiUrl}/plans`, { headers: this.withAuth() }).pipe(
      tap((data: any) => this.setPlanData(data))
    );
  }

  /**
   * Obtém os dados da assinatura
   * @returns dados da assinatura
   */
  getSubscriptionData(): Observable<SubscriptionModel> {
    const subscriptionData = sessionStorage.getItem('subscriptionData');
    if (subscriptionData) {
      return of(JSON.parse(subscriptionData));
    }

    this.accountId = this.authService.getAccountId() || '';

    return this.http.get<SubscriptionModel>(`${this.apiUrl}/subscription/${this.accountId}`, { headers: this.withAuth() }).pipe(
      tap((data: any) => this.setSubscriptionData(data))
    );
  }

  /**
   * Obtém os dados do plano da assinatura
   * @returns dados do plano da assinatura
   */
  getSubscriptionPlanData(): Observable<PlanModel> {
    const subscriptionPlanData = sessionStorage.getItem('subscriptionPlanData');
    if (subscriptionPlanData) {
      return of(JSON.parse(subscriptionPlanData));
    }

    this.accountId = this.authService.getAccountId() || '';

    return this.http.get<PlanModel>(`${this.apiUrl}/subscription/plan/${this.accountId}`, { headers: this.withAuth() }).pipe(
      tap((data: any) => this.setSubscriptionPlanData(data))
    );
  }

  /**
   * Cria uma nova assinatura
   * @param subscriptionData - The subscription data
   * @returns 
   */
  createSubscription(subscriptionData: Partial<SubscriptionModel>): Observable<any> {
    this.accountUserService.getAccountUser().subscribe((res: any) => subscriptionData.account_user_id = res.id);

    const newCardData = {
      account_id: this.authService.getAccountId() || '',
      card_token: subscriptionData.credit_card_token,
      card_mask: subscriptionData.card_mask,
      expiration_date: subscriptionData.expiration_date,
      customer_document: subscriptionData.holder_document,
      brand: subscriptionData.brand,
    }

    const newSubscriptionData = {
      subscription: subscriptionData,
      card: newCardData
    }

    return this.http.post<any>(`${this.apiUrl}/subscription`, newSubscriptionData, { headers: this.withAuth() });
  }

  /**
   * Cancela uma assinatura
   * @param subscriptionId - The subscription ID
   * @returns 
   */
  cancelSubscription(subscriptionId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/subscription/${subscriptionId}`, { headers: this.withAuth() });
  }

  /**
   * Atualiza uma assinatura
   * @param subscriptionId - The subscription ID
   * @param subscriptionData - The subscription data
   * @returns 
   */
  updateSubscription(subscriptionId: string, subscriptionData: Partial<SubscriptionModel>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/subscription/${subscriptionId}`, subscriptionData, { headers: this.withAuth() });
  }

  /**
   * Paga uma fatura
   * @param chargeId - The charge ID
   * @returns 
   */
  payWithCard(chargeId: string): Observable<any> {
    const identity = new IdentityModel();
    identity.accountId = this.authService.getAccountId() || '';
    identity.accountUserId = this.authService.getAccountUserId() || '';

    return this.http.post<any>(`${this.apiUrl}/charge/${chargeId}/pay`, identity, { headers: this.withAuth(true) }).pipe(
      tap(() => this.forceRefresh())
    );
  }

  /**
   * Tenta reprocessar fatura
   * @param chargeId - The charge ID
   * @param identity - The identity of the account
   * @returns 
   */
  retryCharge(chargeId: string): Observable<any> {
    const identity = new IdentityModel();
    identity.accountId = this.authService.getAccountId() || '';
    identity.accountUserId = this.authService.getAccountUserId() || '';

    return this.http.post<any>(`${this.apiUrl}/charge/${chargeId}/retry`, identity, { headers: this.withAuth(true) }).pipe(
      tap(() => this.forceRefresh())
    );
  }

  /**
   * Cleanup ao destruir o serviço
   */
  ngOnDestroy(): void {
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
    }
  }
}
