import { Injectable } from '@angular/core';
import { DashboardModel } from '../models/dashboard.model';
import { BehaviorSubject, Observable, tap, of, Subscription } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { SocketService } from './socket.service';

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

// Interfaces removidas - agora usando WebSocket

/**
 * DashboardService - Gerencia dados do dashboard com cache inteligente e WebSocket
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
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos em milliseconds
  private readonly CACHE_KEY = 'dashboardData';

  private dashboardData = new BehaviorSubject<DashboardModel>({} as DashboardModel);
  $dashboardData = this.dashboardData.asObservable();

  private loadingState = new BehaviorSubject<boolean>(false);
  $isLoading = this.loadingState.asObservable();

  private totalProducts = new BehaviorSubject<number>(0);
  $totalProducts = this.totalProducts.asObservable();

  private connectionStatus = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  $connectionStatus = this.connectionStatus.asObservable();

  private dashboardStatus = new BehaviorSubject<DashboardStatus | null>(null);
  $dashboardStatus = this.dashboardStatus.asObservable();

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  })

  private accountId!: string | null;
  private webSocketSubscriptions: Subscription[] = [];

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private socketService: SocketService
  ) { }

  setDashboardData(data: DashboardModel): void {
    this.dashboardData.next(data);

    this.totalProducts.next(data.totalProducts);

    // Salvar no cache com timestamp
    const cachedData: CachedDashboardData = {
      data,
      timestamp: Date.now(),
      accountId: this.accountId || '',
      totalProducts: data.totalProducts
    };
    sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(cachedData));
  }

  private getCachedData(): DashboardModel | null {
    try {
      const cached = sessionStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const cachedData: CachedDashboardData = JSON.parse(cached);

      if (cachedData.accountId !== this.accountId) {
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

  getDashboardData(forceRefresh: boolean = false): Observable<DashboardModel> {
    this.accountId = this.authService.getAccountId();
    
    if (!this.accountId) {
      console.error('❌ Dashboard: AccountId não encontrado - usuário não está logado');
      this.loadingState.next(false);
      return of({} as DashboardModel);
    }

    if (!this.authService.getToken()) {
      console.error('❌ Dashboard: Token não encontrado - usuário não está autenticado');
      this.loadingState.next(false);
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
    
    return this.http.get<DashboardModel>(`${this.API_URL}/${this.accountId}`, { headers: this.headers }).pipe(
      tap((data: DashboardModel) => {
        this.setDashboardData(data);
        this.loadingState.next(false);
      }),
      catchError((error) => {
        console.error('❌ Dashboard: Erro ao buscar dados:', error);
        this.loadingState.next(false);
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
    this.accountId = this.authService.getAccountId();
    
    if (!this.accountId) {
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
    
    return this.http.get<QuickDashboardResponse>(`${this.API_URL}/${this.accountId}/quick`, { headers: this.headers }).pipe(
      tap((response: QuickDashboardResponse) => {
        this.setDashboardData(response.data);
        this.loadingState.next(false);
      }),
      map((response: QuickDashboardResponse) => response.data),
      catchError((error) => {
        this.loadingState.next(false);
        return this.getDashboardData(forceRefresh);
      })
    );
  }

  /**
   * Força refresh via backend (invalida cache)
   */
  forceRefresh(): Observable<{ success: boolean; jobId?: string; message: string }> {
    this.accountId = this.authService.getAccountId();
    
    if (!this.accountId) {
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
      `${this.API_URL}/${this.accountId}/refresh`, 
      {},
      { headers: this.headers }
    ).pipe(
      tap((response) => {
        if (response.success) {
          this.clearCache();
        }
      }),
      catchError((error) => {
        return of({ success: false, message: 'Erro no refresh' });
      })
    );
  }

  /**
   * Busca status do cache e jobs background
   */
  getStatus(): Observable<DashboardStatus> {
    this.accountId = this.authService.getAccountId();
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    this.headers = this.headers.set('X-Skip-Loading', 'true');
    
    return this.http.get<DashboardStatus>(`${this.API_URL}/${this.accountId}/status`, { headers: this.headers }).pipe(
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
   * Conecta ao WebSocket para updates em tempo real
   */
  connectToWebSocket(): void {
    this.accountId = this.authService.getAccountId();
    
    if (!this.accountId) {
      console.error('❌ Dashboard: AccountId não encontrado - usuário não está logado');
      this.connectionStatus.next('disconnected');
      return;
    }

    // Verificar se o token ainda é válido
    if (!this.authService.getToken()) {
      console.error('❌ Dashboard: Token não encontrado - usuário não está autenticado');
      this.connectionStatus.next('disconnected');
      return;
    }

    // Desconectar se já estiver conectado
    if (this.socketService.isSocketConnected()) {
      this.disconnectFromWebSocket();
    }

    this.connectionStatus.next('connecting');
    console.log('📡 Dashboard: Conectando ao WebSocket');

    // Conectar ao WebSocket
    this.socketService.connect(this.accountId).then(() => {
      console.log('✅ Dashboard: WebSocket conectado');
      this.setupWebSocketListeners();
    }).catch((error) => {
      console.error('❌ Dashboard: Erro ao conectar WebSocket', error);
      this.connectionStatus.next('disconnected');
    });
  }

  /**
   * Configura listeners para eventos WebSocket
   */
  private setupWebSocketListeners(): void {
    // Limpar subscriptions anteriores
    this.webSocketSubscriptions.forEach(sub => sub.unsubscribe());
    this.webSocketSubscriptions = [];

    // Status de conexão
    const connectionSub = this.socketService.$connectionStatus.subscribe(status => {
      if (status.status === 'connected') {
        this.connectionStatus.next('connected');
        // Solicitar status inicial
        this.socketService.requestDashboardStatus();
      } else if (status.status === 'disconnected' || status.status === 'error') {
        this.connectionStatus.next('disconnected');
      }
    });
    this.webSocketSubscriptions.push(connectionSub);

    // Atualizações do dashboard
    const dashboardSub = this.socketService.onDashboard().subscribe(data => {
      console.log('✨ Dashboard: Dados atualizados via WebSocket');
      this.setDashboardData(data);
    });
    this.webSocketSubscriptions.push(dashboardSub);

    // Status do dashboard
    const statusSub = this.socketService.onDashboardStatus().subscribe(status => {
      console.log('📊 Dashboard: Status atualizado via WebSocket');
      this.dashboardStatus.next(status);
    });
    this.webSocketSubscriptions.push(statusSub);

    // Erros do dashboard
    const errorSub = this.socketService.onDashboardError().subscribe(error => {
      console.error('❌ Dashboard: Erro via WebSocket', error);
    });
    this.webSocketSubscriptions.push(errorSub);

    // Eventos de refresh
    const refreshSub = this.socketService.onRefreshEvents().subscribe(event => {
      this.handleRefreshEvent(event);
    });
    this.webSocketSubscriptions.push(refreshSub);
  }

  /**
   * Desconecta do WebSocket
   */
  disconnectFromWebSocket(): void {
    // Limpar subscriptions
    this.webSocketSubscriptions.forEach(sub => sub.unsubscribe());
    this.webSocketSubscriptions = [];

    // Desconectar WebSocket
    this.socketService.disconnect();
    this.connectionStatus.next('disconnected');
    console.log('📡 Dashboard: WebSocket desconectado');
  }

  /**
   * Processa eventos de refresh recebidos via WebSocket
   */
  private handleRefreshEvent(event: any): void {
    switch (event.type) {
      case 'dashboard-refresh-started':
        console.log('🔄 Dashboard: Refresh iniciado via WebSocket');
        break;
        
      case 'dashboard-refresh-result':
        console.log('✅ Dashboard: Refresh concluído via WebSocket', event.message);
        if (event.success && event.jobId) {
          console.log('📋 Dashboard: Job ID:', event.jobId);
        }
        break;
        
      case 'dashboard-refresh-error':
        console.error('❌ Dashboard: Erro no refresh via WebSocket', event.error);
        break;
        
      default:
        console.log('📡 Dashboard: Evento de refresh desconhecido', event);
    }
  }

  /**
   * Verifica se está conectado ao WebSocket
   */
  isConnectedToUpdates(): boolean {
    return this.socketService.isSocketConnected();
  }

  /**
   * Solicita refresh do dashboard via WebSocket
   */
  requestWebSocketRefresh(force: boolean = false): void {
    if (this.isConnectedToUpdates()) {
      this.socketService.requestDashboardRefresh(force);
    } else {
      console.warn('⚠️ Dashboard: WebSocket não conectado - usando refresh via API');
      this.forceRefresh().subscribe();
    }
  }

  /**
   * Solicita status do dashboard via WebSocket
   */
  requestWebSocketStatus(): void {
    if (this.isConnectedToUpdates()) {
      this.socketService.requestDashboardStatus();
    } else {
      console.warn('⚠️ Dashboard: WebSocket não conectado - usando status via API');
      this.getStatus().subscribe();
    }
  }

  /**
   * Método de cleanup (chame quando destruir componente)
   */
  cleanup(): void {
    this.disconnectFromWebSocket();
    this.dashboardData.complete();
    this.loadingState.complete();
    this.connectionStatus.complete();
    this.dashboardStatus.complete();
  }
}
