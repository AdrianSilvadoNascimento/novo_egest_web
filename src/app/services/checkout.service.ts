import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { PlanModel } from '../models/plan.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { SubscriptionModel } from '../models/account.model';
import { AccountUserService } from './account-user.service';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private apiUrl = `${environment.apiUrl}/checkout`;
  private headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  private planData = new BehaviorSubject<PlanModel[]>([]);
  $planData = this.planData.asObservable();

  constructor(private http: HttpClient, private authService: AuthService, private accountUserService: AccountUserService) { }

  /**
   * Define os dados dos planos no BehaviorSubject e no sessionStorage
   * @param data - dados dos planos
   */
  setPlanData(data: PlanModel[]) {
    sessionStorage.setItem('planData', JSON.stringify(data));
    this.planData.next(data);
  }

  /**
   * Adiciona o token de autenticação ao headers
   * @returns headers com o token de autenticação
   */
  private withAuth(): HttpHeaders {
    return this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
  }

  /**
   * Obtém os planos
   * @returns planos
   */
  getPlans(): Observable<PlanModel[]> {
    return this.http.get<PlanModel[]>(`${this.apiUrl}/plans`, { headers: this.withAuth() }).pipe(
      tap((data: any) => this.setPlanData(data))
    );
  }

  /**
   * Cria uma nova assinatura
   * @param subscriptionData 
   * @returns 
   */
  createSubscription(subscriptionData: Partial<SubscriptionModel>): Observable<any> {
    this.accountUserService.getAccountUser().subscribe((res: any) => subscriptionData.account_user_id = res.id);

    return this.http.post<any>(`${this.apiUrl}/subscription`, subscriptionData, { headers: this.withAuth() });
  }
}
