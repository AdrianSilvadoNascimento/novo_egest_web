import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Interfaces para tipagem
interface DashboardEvent {
  type: 'dashboard-updated' | 'dashboard-status' | 'dashboard-error' | 'dashboard-connected' | 'heartbeat';
  data?: any;
  error?: string;
  timestamp: number;
  accountId?: string;
}

interface RefreshEvent {
  type: 'dashboard-refresh-started' | 'dashboard-refresh-result' | 'dashboard-refresh-error';
  accountId: string;
  success?: boolean;
  jobId?: string;
  message?: string;
  error?: string;
  force?: boolean;
  timestamp: number;
}

interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  accountId?: string;
  room?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private readonly API_URL = environment.apiUrl;
  
  // Estados de conexão
  private connectionStatus = new BehaviorSubject<ConnectionStatus>({ status: 'disconnected' });
  $connectionStatus = this.connectionStatus.asObservable();
  
  // Eventos específicos
  private dashboardEvents = new Subject<DashboardEvent>();
  private refreshEvents = new Subject<RefreshEvent>();
  
  // Rate limiting
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 segundo entre requests
  
  // Configurações
  private isConnected = false;
  private currentAccountId: string | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private reconnectDelay = 1000;

  constructor(private authService: AuthService) {
    this.initializeSocket();
  }

  /**
   * Inicializa o socket com configurações básicas
   */
  private initializeSocket(): void {
    // Usar namespace padrão explicitamente
    this.socket = io(this.API_URL, {
      autoConnect: false, // Conectar manualmente após autenticação
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: this.reconnectDelay,
      forceNew: true, // Força nova conexão
      upgrade: true, // Permite upgrade de polling para websocket
      path: '/socket.io/', // Caminho padrão do Socket.IO
    });

    this.setupEventListeners();
  }

  /**
   * Configura listeners para eventos do socket
   */
  private setupEventListeners(): void {
    // Conexão estabelecida
    this.socket.on('connect', () => {
      console.log('🔌 WebSocket: Conectado');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionStatus.next({ 
        status: 'connected', 
        accountId: this.currentAccountId || undefined
      });
    });

    // Desconexão
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket: Desconectado -', reason);
      this.isConnected = false;
      this.connectionStatus.next({ status: 'disconnected' });
    });

    // Erro de conexão
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket: Erro de conexão', error);
      this.connectionStatus.next({ 
        status: 'error', 
        error: error.message 
      });
    });

    // Eventos de dashboard
    this.socket.on('dashboard-connected', (data) => {
      console.log('📡 WebSocket: Dashboard conectado', data);
      this.dashboardEvents.next({
        type: 'dashboard-connected',
        data,
        timestamp: Date.now(),
        accountId: data.accountId
      });
    });

    this.socket.on('dashboard-updated', (data) => {
      console.log('✨ WebSocket: Dashboard atualizado');
      this.dashboardEvents.next({
        type: 'dashboard-updated',
        data: data.data,
        timestamp: data.timestamp,
        accountId: this.currentAccountId || undefined
      });
    });

    this.socket.on('dashboard-status', (data) => {
      console.log('📊 WebSocket: Status atualizado');
      this.dashboardEvents.next({
        type: 'dashboard-status',
        data: data.data,
        timestamp: data.timestamp,
        accountId: this.currentAccountId || undefined
      });
    });

    this.socket.on('dashboard-error', (data) => {
      console.error('❌ WebSocket: Erro no dashboard', data);
      this.dashboardEvents.next({
        type: 'dashboard-error',
        error: data.error,
        timestamp: data.timestamp,
        accountId: this.currentAccountId || undefined
      });
    });

    this.socket.on('heartbeat', (data) => {
      // Heartbeat silencioso - apenas para manter conexão
    });

    // Eventos de refresh
    this.socket.on('dashboard-refresh-started', (data) => {
      console.log('🔄 WebSocket: Refresh iniciado', data);
      this.refreshEvents.next({
        type: 'dashboard-refresh-started',
        accountId: data.accountId,
        force: data.force,
        timestamp: data.timestamp
      });
    });

    this.socket.on('dashboard-refresh-result', (data) => {
      console.log('✅ WebSocket: Refresh concluído', data);
      this.refreshEvents.next({
        type: 'dashboard-refresh-result',
        accountId: data.accountId,
        success: data.success,
        jobId: data.jobId,
        message: data.message,
        timestamp: data.timestamp
      });
    });

    this.socket.on('dashboard-refresh-error', (data) => {
      console.error('❌ WebSocket: Erro no refresh', data);
      this.refreshEvents.next({
        type: 'dashboard-refresh-error',
        accountId: data.accountId,
        error: data.error,
        timestamp: data.timestamp
      });
    });

    // Pong response
    this.socket.on('pong', (data) => {
      console.log('🏓 WebSocket: Pong recebido', data);
    });

    // Erro geral
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket: Erro geral', error);
      this.connectionStatus.next({ 
        status: 'error', 
        error: error.message 
      });
    });
  }

  /**
   * Conecta ao WebSocket com autenticação
   */
  async connect(accountId: string): Promise<void> {
    if (this.isConnected && this.currentAccountId === accountId) {
      console.log('🔌 WebSocket: Já conectado para esta conta');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    this.currentAccountId = accountId;
    this.connectionStatus.next({ status: 'connecting' });

    try {
      // Desconectar e destruir socket anterior se existir
      if (this.socket) {
        this.socket.disconnect();
        this.socket.removeAllListeners();
      }

      // Aguardar um pouco antes de reconectar
      await new Promise(resolve => setTimeout(resolve, 200));

      // Criar nova instância do socket
      this.socket = io(this.API_URL, {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: this.reconnectDelay,
        forceNew: true,
        upgrade: true,
        path: '/socket.io/',
        auth: { token }, // Configurar auth na criação
      });

      // Reconfigurar listeners
      this.setupEventListeners();
      
      // Conectar
      this.socket.connect();
      
      console.log('🔌 WebSocket: Conectando...');
    } catch (error) {
      console.error('❌ WebSocket: Erro ao conectar', error);
      this.connectionStatus.next({ 
        status: 'error', 
        error: 'Falha na conexão' 
      });
      throw error;
    }
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.currentAccountId = null;
      this.connectionStatus.next({ status: 'disconnected' });
      console.log('🔌 WebSocket: Desconectado');
    }
  }

  /**
   * Verifica se está conectado
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected;
  }

  // === OBSERVABLES PARA EVENTOS ===

  /**
   * Observable para eventos de dashboard
   */
  onDashboardEvents(): Observable<DashboardEvent> {
    return this.dashboardEvents.asObservable();
  }

  /**
   * Observable para eventos de refresh
   */
  onRefreshEvents(): Observable<RefreshEvent> {
    return this.refreshEvents.asObservable();
  }

  /**
   * Observable para atualizações do dashboard (compatibilidade)
   */
  onDashboard(): Observable<any> {
    return this.dashboardEvents.pipe(
      filter(event => event.type === 'dashboard-updated'),
      map(event => event.data)
    );
  }

  /**
   * Observable para status do dashboard
   */
  onDashboardStatus(): Observable<any> {
    return this.dashboardEvents.pipe(
      filter(event => event.type === 'dashboard-status'),
      map(event => event.data)
    );
  }

  /**
   * Observable para erros do dashboard
   */
  onDashboardError(): Observable<string> {
    return this.dashboardEvents.pipe(
      filter(event => event.type === 'dashboard-error'),
      map(event => event.error || 'Erro desconhecido')
    );
  }

  // === MÉTODOS DE AÇÃO ===

  /**
   * Solicita refresh do dashboard
   */
  requestDashboardRefresh(force: boolean = false): void {
    if (!this.checkRateLimit()) {
      console.warn('⚠️ WebSocket: Rate limit - aguarde antes de fazer outra requisição');
      return;
    }

    if (!this.isSocketConnected()) {
      console.warn('⚠️ WebSocket: Não conectado - não é possível solicitar refresh');
      return;
    }

    this.socket.emit('dashboard-refresh', { force });
    console.log('🔄 WebSocket: Refresh solicitado', { force });
  }

  /**
   * Solicita status do dashboard
   */
  requestDashboardStatus(): void {
    if (!this.checkRateLimit()) {
      console.warn('⚠️ WebSocket: Rate limit - aguarde antes de fazer outra requisição');
      return;
    }

    if (!this.isSocketConnected()) {
      console.warn('⚠️ WebSocket: Não conectado - não é possível solicitar status');
      return;
    }

    this.socket.emit('dashboard-status-request', {});
    console.log('📊 WebSocket: Status solicitado');
  }

  /**
   * Envia ping para manter conexão ativa
   */
  ping(): void {
    if (this.isSocketConnected()) {
      this.socket.emit('ping', {});
    }
  }

  /**
   * Emite um evento customizado para o servidor
   */
  emit(event: string, data: any): void {
    if (this.isSocketConnected()) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ WebSocket: Não conectado - evento não enviado:', event);
    }
  }

  // === MÉTODOS UTILITÁRIOS ===

  /**
   * Verifica rate limiting
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.lastRequestTime < this.MIN_REQUEST_INTERVAL) {
      return false;
    }
    this.lastRequestTime = now;
    return true;
  }

  /**
   * Obtém informações da conexão atual
   */
  getConnectionInfo(): { isConnected: boolean; accountId: string | null; status: string } {
    return {
      isConnected: this.isSocketConnected(),
      accountId: this.currentAccountId,
      status: this.connectionStatus.value.status
    };
  }

  /**
   * Cleanup quando o serviço é destruído
   */
  ngOnDestroy(): void {
    this.disconnect();
    this.dashboardEvents.complete();
    this.refreshEvents.complete();
    this.connectionStatus.complete();
  }
}
