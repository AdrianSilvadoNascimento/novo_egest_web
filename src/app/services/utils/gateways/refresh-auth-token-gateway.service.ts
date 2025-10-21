import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { GatewaySocketService } from './gateway-socket.service';

export interface RefreshToken {
  token: string;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class RefreshAuthTokenGatewayService {
  private refreshAuthToken = new Subject<RefreshToken>();

  constructor(
    private readonly socketService: GatewaySocketService
  ) {
    this.initializeWebSocketListener();
  }

  /**
   * Inicializa o listener do WebSocket de forma global e persistente
   * Este listener nunca é destruído, mantendo a escuta ativa durante toda a sessão
   */
  private initializeWebSocketListener(): void {
    this.socketService.socket.on('refresh_token', (data: RefreshToken) => {
      this.refreshAuthToken.next(data);
    });
  }

  /**
   * Observable para componentes se inscreverem e receberem atualizações do novo token
   * Este observable emite sempre que o backend envia um evento refresh_token
   */
  onRefreshToken(): Observable<RefreshToken> {
    return this.refreshAuthToken.asObservable();
  }

  /**
   * Emite um evento customizado via WebSocket
   */
  emit(eventName: string, data: any): void {
    this.socketService.socket.emit(eventName, data);
  }
}
