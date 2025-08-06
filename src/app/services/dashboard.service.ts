import { Injectable } from '@angular/core';
import { DashboardModel } from '../models/dashboard.model';
import { BehaviorSubject, Observable, tap, of, NEVER } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, retry, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

interface CachedDashboardData {
  data: DashboardModel;
  timestamp: number;
  accountId: string;
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

interface SSEEvent {
  type: 'connected' | 'status' | 'dashboard-updated' | 'calculation-failed' | 'heartbeat';
  data?: any;
  error?: string;
  timestamp: number;
  accountId?: string;
}

/**
 * DashboardService - Gerencia dados do dashboard com cache inteligente e SSE
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

  private connectionStatus = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  $connectionStatus = this.connectionStatus.asObservable();

  private dashboardStatus = new BehaviorSubject<DashboardStatus | null>(null);
  $dashboardStatus = this.dashboardStatus.asObservable();

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  })

  private accountId!: string | null
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

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
    // Skip loading global - dashboard tem seu próprio skeleton loading
    this.headers = this.headers.set('X-Skip-Loading', 'true');
    
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

  /**
   * Carregamento super otimizado - usa endpoint /quick
   */
  getDashboardQuick(forceRefresh: boolean = false): Observable<DashboardModel> {
    this.accountId = this.authService.getAccountId();
    
    // Verificar cache local primeiro (se não for refresh forçado)
    if (!forceRefresh) {
      const cachedData = this.getCachedData();
      if (cachedData) {
        console.log('🚀 Dashboard: Carregado do cache local');
        this.setDashboardData(cachedData);
        return of(cachedData);
      }
    }

    // Buscar do backend otimizado
    console.log('🌐 Dashboard: Carregando via /quick endpoint');
    this.loadingState.next(true);
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    // Skip loading global - dashboard tem seu próprio skeleton loading
    this.headers = this.headers.set('X-Skip-Loading', 'true');
    
    return this.http.get<QuickDashboardResponse>(`${this.API_URL}/${this.accountId}/quick`, { headers: this.headers }).pipe(
      tap((response: QuickDashboardResponse) => {
        this.setDashboardData(response.data);
        this.loadingState.next(false);
        
        // Log informativo
        if (response.fromCache) {
          console.log(`📦 Dashboard: Dados do cache Redis (age: ${response.age}s)`);
        } else {
          console.log(`⏳ Dashboard: Dados calculados em background (job: ${response.jobId})`);
        }
      }),
      map((response: QuickDashboardResponse) => response.data),
      catchError((error) => {
        console.error('❌ Dashboard: Erro no carregamento rápido', error);
        this.loadingState.next(false);
        // Fallback para método tradicional
        return this.getDashboardData(forceRefresh);
      })
    );
  }

  /**
   * Força refresh via backend (invalida cache)
   */
  forceRefresh(): Observable<{ success: boolean; jobId?: string; message: string }> {
    this.accountId = this.authService.getAccountId();
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    // Skip loading global - dashboard tem seu próprio loading state
    this.headers = this.headers.set('X-Skip-Loading', 'true');
    
    console.log('🔄 Dashboard: Forçando refresh completo');
    
    return this.http.post<{ success: boolean; jobId?: string; message: string }>(
      `${this.API_URL}/${this.accountId}/refresh`, 
      {},
      { headers: this.headers }
    ).pipe(
      tap((response) => {
        if (response.success) {
          console.log(`✅ Dashboard: Refresh iniciado (job: ${response.jobId})`);
          // Limpar cache local
          this.clearCache();
        }
      }),
      catchError((error) => {
        console.error('❌ Dashboard: Erro no refresh forçado', error);
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
    // Skip loading global - é uma verificação de status background
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
   * Conecta ao stream SSE para updates em tempo real
   */
  connectToUpdates(): Observable<SSEEvent> {
    this.accountId = this.authService.getAccountId();
    
    if (this.eventSource) {
      this.disconnectFromUpdates();
    }

    this.connectionStatus.next('connecting');
    console.log('📡 Dashboard: Conectando ao stream SSE');

    const token = this.authService.getToken();
    if (!token) {
      console.error('❌ Dashboard: Token não encontrado para SSE');
      this.connectionStatus.next('disconnected');
      return NEVER;
    }

    // EventSource não suporta headers, então enviamos token via query string
    const url = `${this.API_URL}/${this.accountId}/stream?token=${encodeURIComponent(token)}`;
    
    this.eventSource = new EventSource(url);

    return new Observable<SSEEvent>((observer) => {
      if (!this.eventSource) return;

      this.eventSource.onopen = () => {
        this.connectionStatus.next('connected');
        this.reconnectAttempts = 0;
        console.log('✅ Dashboard: Conectado ao stream SSE');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          observer.next(data);
          
          // Processar eventos específicos
          this.handleSSEEvent(data);
          
        } catch (error) {
          console.error('❌ Dashboard: Erro ao processar evento SSE', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ Dashboard: Erro na conexão SSE', error);
        this.connectionStatus.next('disconnected');
        
        // Se for erro de autorização (401), não tentar reconectar
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          console.error('❌ Dashboard: Conexão fechada (possivelmente token inválido)');
          observer.error(new Error('Token de autorização inválido ou expirado'));
          return;
        }
        
        // Tentar reconectar apenas se não for erro de autorização
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Dashboard: Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          setTimeout(() => {
            this.connectToUpdates().subscribe(observer);
          }, this.reconnectDelay * this.reconnectAttempts);
        } else {
          console.error('❌ Dashboard: Máximo de tentativas de reconexão excedido');
          observer.error(error);
        }
      };

      // Cleanup
      return () => {
        this.disconnectFromUpdates();
      };
    }).pipe(
      retry({ count: 3, delay: 2000 }),
      catchError((error) => {
        console.error('❌ Dashboard: Falha definitiva na conexão SSE', error);
        this.connectionStatus.next('disconnected');
        return NEVER;
      })
    );
  }

  /**
   * Desconecta do stream SSE
   */
  disconnectFromUpdates(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connectionStatus.next('disconnected');
      console.log('📡 Dashboard: Desconectado do stream SSE');
    }
  }

  /**
   * Processa eventos SSE recebidos
   */
  private handleSSEEvent(event: SSEEvent): void {
    switch (event.type) {
      case 'connected':
        console.log('📡 Dashboard: Stream conectado', event);
        break;
        
      case 'status':
        console.log('📊 Dashboard: Status atualizado', event.data);
        this.dashboardStatus.next(event.data);
        break;
        
      case 'dashboard-updated':
        console.log('✨ Dashboard: Dados atualizados via SSE');
        this.setDashboardData(event.data);
        break;
        
      case 'calculation-failed':
        console.error('❌ Dashboard: Falha no cálculo', event.error);
        break;
        
      case 'heartbeat':
        // Silent heartbeat
        break;
        
      default:
        console.log('📡 Dashboard: Evento SSE desconhecido', event);
    }
  }

  /**
   * Verifica se está conectado ao stream
   */
  isConnectedToUpdates(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }

  /**
   * Método de cleanup (chame quando destruir componente)
   */
  cleanup(): void {
    this.disconnectFromUpdates();
    this.dashboardData.complete();
    this.loadingState.complete();
    this.connectionStatus.complete();
    this.dashboardStatus.complete();
  }
}
