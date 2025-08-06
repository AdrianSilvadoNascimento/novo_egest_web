import { Injectable } from '@angular/core';
import { DashboardModel } from '../models/dashboard.model';
import { BehaviorSubject, Observable, tap, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

interface CachedDashboardData {
  data: DashboardModel;
  timestamp: number;
  accountId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}/dashboard`
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos em milliseconds
  private readonly CACHE_KEY = 'dashboardData';

  private dashboardData = new BehaviorSubject<DashboardModel>({} as DashboardModel);
  $dashboardData = this.dashboardData.asObservable();

  private loadingState = new BehaviorSubject<boolean>(false);
  $isLoading = this.loadingState.asObservable();

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  })

  private accountId!: string | null

  constructor(private http: HttpClient, private authService: AuthService) { }

  setDashboardData(data: DashboardModel): void {
    this.dashboardData.next(data);
    
    // Salvar no cache com timestamp
    const cachedData: CachedDashboardData = {
      data,
      timestamp: Date.now(),
      accountId: this.accountId || ''
    };
    sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(cachedData));
  }

  private getCachedData(): DashboardModel | null {
    try {
      const cached = sessionStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const cachedData: CachedDashboardData = JSON.parse(cached);
      
      // Verificar se é da mesma conta
      if (cachedData.accountId !== this.accountId) {
        this.clearCache();
        return null;
      }

      // Verificar se ainda está fresco (dentro do TTL)
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

  getDashboardData(forceRefresh: boolean = false): Observable<DashboardModel> {
    this.accountId = this.authService.getAccountId();
    
    // Verificar cache primeiro (se não for refresh forçado)
    if (!forceRefresh) {
      const cachedData = this.getCachedData();
      if (cachedData) {
        console.log('🚀 Dashboard: Carregado do cache');
        this.setDashboardData(cachedData);
        return of(cachedData);
      }
    }

    // Buscar dados da API
    console.log('🌐 Dashboard: Carregando da API');
    this.loadingState.next(true);
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    
    return this.http.get<DashboardModel>(`${this.API_URL}/${this.accountId}`, { headers: this.headers }).pipe(
      tap((data: DashboardModel) => {
        this.setDashboardData(data);
        this.loadingState.next(false);
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
}
