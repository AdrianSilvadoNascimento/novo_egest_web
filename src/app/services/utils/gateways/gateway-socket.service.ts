import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../../environments/environment';

const wsUrl = environment.wsUrl || environment.apiUrl.replace('/api', '');

@Injectable({
  providedIn: 'root'
})
export class GatewaySocketService {
  public readonly socket: Socket;

  constructor() {
    const token = this.getAuthToken();

    if (!token) {
      console.warn('⚠️ Nenhum token de autenticação encontrado para WebSocket');
    }

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: { token }
    });

    this.socket.on('connect', () => {
      // console.log('✅ WebSocket conectado! ID:', this.socket.id);
    });

    this.socket.on('connected', (data) => {
      // console.log('✅ WebSocket autenticado:', data);
    });

    this.socket.on('error', (error) => {
      // console.error('❌ Erro recebido do servidor:', error);
    });

    this.socket.on('disconnect', (reason) => {
      // console.log('❌ WebSocket desconectado:', reason);

      if (reason === 'io server disconnect') {
        this.reconnectWithNewToken();
      }
    });

    this.socket.on('connect_error', (error) => {
      if (error.message.includes('Token') || error.message.includes('autenticação')) {
        this.reconnectWithNewToken();
      }
    });
  }

  /**
   * Obtém o token de autenticação do storage correto
   */
  private getAuthToken(): string | null {
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    const token = rememberMe
      ? localStorage.getItem('token')
      : sessionStorage.getItem('token');

    return token;
  }

  /**
   * Reconecta o WebSocket com um novo token
   */
  private reconnectWithNewToken(): void {
    const newToken = this.getAuthToken();

    if (newToken) {
      this.socket.auth = { token: newToken };
      this.socket.connect();
    } else {
      console.error('❌ Não foi possível obter novo token para reconexão');
    }
  }

  /**
   * Desconecta manualmente o WebSocket
   */
  disconnect(): void {
    this.socket.disconnect();
  }

  /**
   * Reconecta manualmente o WebSocket
   */
  reconnect(): void {
    this.reconnectWithNewToken();
  }
}
