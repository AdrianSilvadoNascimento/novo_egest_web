import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../../environments/environment';
import { AccountUserModel } from '../../../models/account_user.model';
import { UtilsAuthService } from '../utils-auth.service';
import { AuthService } from '../../auth.service';

const wsUrl = environment.wsUrl || environment.apiUrl.replace('/api', '');

@Injectable({
  providedIn: 'root'
})
export class GatewaySocketService {
  public socket!: Socket;
  currentAccountUser: AccountUserModel = new AccountUserModel();

  token!: string
  refreshToken!: string

  constructor(private readonly utilsAuthService: UtilsAuthService, private readonly authService: AuthService) {
    this.getAuthToken();
    this.getRefreshToken();

    if (!this.token) {
      console.warn('⚠️ Nenhum token de autenticação encontrado para WebSocket');
    }

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: { token: this.token, refreshToken: this.refreshToken },
    });

    this.socket.on('connect', () => {
    });

    this.socket.on('connected', (data) => {
    });

    this.socket.on('error', (error) => {
    });

    this.socket.on('disconnect', (reason) => {

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
  private getAuthToken(): void {
    this.utilsAuthService.currentAccountUser().subscribe({
      next: (currentAccountUser) => {
        this.currentAccountUser = currentAccountUser;

        this.token = currentAccountUser.remember_me
          ? localStorage.getItem('token')!!
          : sessionStorage.getItem('token')!!;
      },
    });
  }

  private getRefreshToken(): void {
    this.utilsAuthService.currentAccountUser().subscribe({
      next: (currentAccountUser) => {
        this.currentAccountUser = currentAccountUser;

        if (currentAccountUser.remember_me) {
          const fromLocalStorage = localStorage.getItem('refresh_token')!!;
          this.refreshToken = currentAccountUser.refresh_token || fromLocalStorage;
        }
      }
    })

    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem('refresh_token')!!;
    }
  }

  /**
   * Reconecta o WebSocket com um novo token
   */
  private reconnectWithNewToken(): void {
    this.getAuthToken();

    if (this.token) {
      this.socket.auth = { token: this.token };
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
