import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { GatewaySocketService } from './gateway-socket.service';
import { DashboardModel } from '../../../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardGatewayService {
  private dashboardRefresh$ = new Subject<DashboardModel>();

  constructor(private readonly socketService: GatewaySocketService) {
    this.initializeWebSocketListener();
  }

  /**
   * Inicializa o listener do WebSocket de forma global e persistente
   * Este listener nunca é destruído, mantendo a escuta ativa durante toda a sessão
   */
  private initializeWebSocketListener(): void {
    this.socketService.socket.on('refreshDashboard', (data: DashboardModel) => {
      this.dashboardRefresh$.next(data);
    });
  }

  /**
   * Observable para componentes se inscreverem e receberem atualizações do dashboard
   * Este observable emite sempre que o backend envia um evento refreshDashboard
   */
  onRefreshDashboard(): Observable<DashboardModel> {
    return this.dashboardRefresh$.asObservable();
  }

  /**
   * Emite um evento customizado via WebSocket
   */
  emit(eventName: string, data: any): void {
    this.socketService.socket.emit(eventName, data);
  }
}
