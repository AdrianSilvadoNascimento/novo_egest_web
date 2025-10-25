import { Injectable } from '@angular/core';
import { DashboardModel } from '../models/dashboard.model';
import { BehaviorSubject, Observable, tap, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { AccountModel } from '../models/account.model';
import { UtilsAuthService } from './utils/utils-auth.service';

interface CachedDashboardData {
  data: DashboardModel;
  timestamp: number;
  accountId: string;
  totalProducts: number;
}

interface QuickDashboardResponse {
  data: DashboardModel;
  fromCache: boolean;
  age?: number;
  jobId?: string;
}

interface DashboardStatus {
  cache: {
    exists: boolean;
    needsRefresh: boolean;
    age: number;
    ttl: number;
    type: string;
  };
  background: {
    hasActiveJobs: boolean;
    jobCount: number;
    lastUpdate?: number;
  };
}

/**
 * DashboardService - Gerencia dados do dashboard com cache inteligente
 *
 * IMPORTANTE: Este serviço usa header 'X-Skip-Loading' em todas as requisições
 * para evitar conflito com o LoadingInterceptor global. O dashboard possui
 * seu próprio skeleton loading e não deve bloquear a navegação do usuário.
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}/dashboard`
  private readonly CACHE_TTL = 1 * 60 * 1000; // 5 minutos em milliseconds
  private readonly CACHE_KEY = 'dashboardData';

  private dashboardData = new BehaviorSubject<DashboardModel>({} as DashboardModel);
  $dashboardData = this.dashboardData.asObservable();

  private loadingState = new BehaviorSubject<boolean>(false);
  $isLoading = this.loadingState.asObservable();

  private totalProducts = new BehaviorSubject<number>(0);
  $totalProducts = this.totalProducts.asObservable();

  private dashboardStatus = new BehaviorSubject<DashboardStatus | null>(null);
  $dashboardStatus = this.dashboardStatus.asObservable();

  private pendingUpdate = new BehaviorSubject<boolean>(false);
  $pendingUpdate = this.pendingUpdate.asObservable();

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  })

  private currentAccount: AccountModel = new AccountModel();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private readonly utilsAuthService: UtilsAuthService
  ) {
    this.utilsAuthService.currentAccount().subscribe(account => this.currentAccount = account);
  }

  setDashboardData(data: DashboardModel): void {
    this.dashboardData.next(data);
    this.totalProducts.next(data.totalProducts);
    this.pendingUpdate.next(false);

    const cachedData: CachedDashboardData = {
      data,
      timestamp: Date.now(),
      accountId: this.currentAccount.id || '',
      totalProducts: data.totalProducts
    };
    sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(cachedData));
  }

  private getCachedData(): DashboardModel | null {
    try {
      const cached = sessionStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const cachedData: CachedDashboardData = JSON.parse(cached);

      if (cachedData.accountId !== this.currentAccount.id) {
        this.clearCache();
        return null;
      }

      const isExpired = (Date.now() - cachedData.timestamp) > this.CACHE_TTL;
      if (isExpired) {
        this.clearCache();
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.warn('Erro ao ler cache do dashboard:', error);
      this.clearCache();
      return null;
    }
  }

  private clearCache(): void {
    sessionStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Limpa o cache do dashboard (público)
   * Usado após operações que afetam os dados do dashboard (ex: movimentações)
   */
  public clearDashboardCache(): void {
    this.clearCache();
    this.pendingUpdate.next(true);
  }

  getDashboardData(forceRefresh: boolean = false): Observable<DashboardModel> {
    if (!this.currentAccount.id) {
      console.error('❌ Dashboard: AccountId não encontrado - usuário não está logado');
      this.loadingState.next(true);
      return of({} as DashboardModel);
    }

    if (!this.authService.getToken()) {
      console.error('❌ Dashboard: Token não encontrado - usuário não está autenticado');
      this.loadingState.next(true);
      return of({} as DashboardModel);
    }

    if (!forceRefresh) {
      const cachedData = this.getCachedData();
      if (cachedData) {
        this.setDashboardData(cachedData);
        return of(cachedData);
      }
    }

    // Buscar dados da API
    this.loadingState.next(true);
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    this.headers = this.headers.set('X-Skip-Loading', 'true');

    return this.http.get<DashboardModel>(`${this.API_URL}/${this.currentAccount.id}`, { headers: this.headers }).pipe(
      tap((data: DashboardModel) => {
        this.setDashboardData(data);
        this.loadingState.next(true);
      }),
      catchError((error) => {
        console.error('❌ Dashboard: Erro ao buscar dados:', error);
        this.loadingState.next(true);
        return of({} as DashboardModel);
      })
    );
  }

  refreshDashboard(): Observable<DashboardModel> {
    return this.getDashboardData(true);
  }

  // Método para verificar se dados estão frescos sem fazer request
  isCacheFresh(): boolean {
    const cached = sessionStorage.getItem(this.CACHE_KEY);
    if (!cached) return false;

    try {
      const cachedData: CachedDashboardData = JSON.parse(cached);
      const isExpired = (Date.now() - cachedData.timestamp) > this.CACHE_TTL;
      return !isExpired && cachedData.accountId === this.authService.getAccountId();
    } catch {
      return false;
    }
  }

  /**
   * Carregamento super otimizado - usa endpoint /quick
   */
  getDashboardQuick(forceRefresh: boolean = false): Observable<DashboardModel> {
    if (!this.currentAccount.id) {
      console.error('❌ Dashboard: AccountId não encontrado - usuário não está logado');
      this.loadingState.next(false);
      return of({} as DashboardModel);
    }

    if (!this.authService.getToken()) {
      console.error('❌ Dashboard: Token não encontrado - usuário não está autenticado');
      this.loadingState.next(false);
      return of({} as DashboardModel);
    }

    // Verificar cache local primeiro (se não for refresh forçado)
    if (!forceRefresh) {
      const cachedData = this.getCachedData();
      if (cachedData) {
        this.setDashboardData(cachedData);
        return of(cachedData);
      }
    }

    // Buscar do backend otimizado
    this.loadingState.next(true);
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    this.headers = this.headers.set('X-Skip-Loading', 'true');

    return this.http.get<QuickDashboardResponse>(`${this.API_URL}/${this.currentAccount.id}/quick`, { headers: this.headers }).pipe(
      tap((response: QuickDashboardResponse) => {
        this.setDashboardData(response.data);
        this.loadingState.next(false);
      }),
      map((response: QuickDashboardResponse) => response.data),
      catchError(() => {
        this.loadingState.next(false);
        return this.getDashboardData(forceRefresh);
      })
    );
  }

  /**
   * Força refresh via backend (invalida cache)
   */
  forceRefresh(): Observable<{ success: boolean; jobId?: string; message: string }> {
    if (!this.currentAccount.id) {
      console.error('❌ Dashboard: AccountId não encontrado - usuário não está logado');
      return of({ success: false, message: 'Usuário não está logado' });
    }

    if (!this.authService.getToken()) {
      console.error('❌ Dashboard: Token não encontrado - usuário não está autenticado');
      return of({ success: false, message: 'Usuário não está autenticado' });
    }

    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    this.headers = this.headers.set('X-Skip-Loading', 'true');

    return this.http.post<{ success: boolean; jobId?: string; message: string }>(
      `${this.API_URL}/${this.currentAccount.id}/refresh`,
      {},
      { headers: this.headers }
    ).pipe(
      tap((response) => {
        if (response.success) {
          this.clearCache();
        }
      }),
      catchError(() => {
        return of({ success: false, message: 'Erro no refresh' });
      })
    );
  }

  /**
   * Busca status do cache e jobs background
   */
  getStatus(): Observable<DashboardStatus> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    this.headers = this.headers.set('X-Skip-Loading', 'true');

    return this.http.get<DashboardStatus>(`${this.API_URL}/${this.currentAccount.id}/status`, { headers: this.headers }).pipe(
      tap((status) => {
        this.dashboardStatus.next(status);
      }),
      catchError((error) => {
        console.error('❌ Dashboard: Erro ao buscar status', error);
        return of({
          cache: { exists: false, needsRefresh: true, age: 0, ttl: 0, type: 'error' },
          background: { hasActiveJobs: false, jobCount: 0 }
        });
      })
    );
  }

  /**
   * Método de cleanup (chame quando destruir componente)
   */
  cleanup(): void {
    this.dashboardData.complete();
    this.loadingState.complete();
    this.dashboardStatus.complete();
  }
}
