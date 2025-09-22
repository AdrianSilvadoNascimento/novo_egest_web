import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SocketService } from '../services/socket.service';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '../services/auth.service';

// Mock do AuthService
const mockAuthService = {
  getToken: () => 'mock-jwt-token',
  getAccountId: () => 'mock-account-id'
};

describe('WebSocket Integration Tests', () => {
  let socketService: SocketService;
  let dashboardService: DashboardService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SocketService,
        DashboardService,
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    socketService = TestBed.inject(SocketService);
    dashboardService = TestBed.inject(DashboardService);
  });

  describe('SocketService', () => {
    it('should be created', () => {
      expect(socketService).toBeTruthy();
    });

    it('should have connection status observable', () => {
      expect(socketService.$connectionStatus).toBeDefined();
    });

    it('should have dashboard events observable', () => {
      expect(socketService.onDashboard()).toBeDefined();
    });

    it('should have refresh events observable', () => {
      expect(socketService.onRefreshEvents()).toBeDefined();
    });

    it('should start disconnected', () => {
      expect(socketService.isSocketConnected()).toBeFalsy();
    });
  });

  describe('DashboardService', () => {
    it('should be created', () => {
      expect(dashboardService).toBeTruthy();
    });

    it('should have dashboard data observable', () => {
      expect(dashboardService.$dashboardData).toBeDefined();
    });

    it('should have loading state observable', () => {
      expect(dashboardService.$isLoading).toBeDefined();
    });

    it('should have connection status observable', () => {
      expect(dashboardService.$connectionStatus).toBeDefined();
    });

    it('should start disconnected', () => {
      expect(dashboardService.isConnectedToUpdates()).toBeFalsy();
    });
  });

  describe('Integration', () => {
    it('should connect to WebSocket when requested', async () => {
      spyOn(socketService, 'connect').and.returnValue(Promise.resolve());
      
      dashboardService.connectToWebSocket();
      
      expect(socketService.connect).toHaveBeenCalledWith('mock-account-id');
    });

    it('should disconnect from WebSocket when requested', () => {
      spyOn(socketService, 'disconnect');
      
      dashboardService.disconnectFromWebSocket();
      
      expect(socketService.disconnect).toHaveBeenCalled();
    });

    it('should request refresh via WebSocket when connected', () => {
      spyOn(socketService, 'isSocketConnected').and.returnValue(true);
      spyOn(socketService, 'requestDashboardRefresh');
      
      dashboardService.requestWebSocketRefresh(true);
      
      expect(socketService.requestDashboardRefresh).toHaveBeenCalledWith(true);
    });

    it('should fallback to API when WebSocket not connected', () => {
      spyOn(socketService, 'isSocketConnected').and.returnValue(false);
      spyOn(dashboardService, 'forceRefresh').and.returnValue({ subscribe: () => {} } as any);
      
      dashboardService.requestWebSocketRefresh(true);
      
      expect(dashboardService.forceRefresh).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket connection errors', async () => {
      spyOn(socketService, 'connect').and.returnValue(Promise.reject(new Error('Connection failed')));
      spyOn(console, 'error');
      
      dashboardService.connectToWebSocket();
      
      // Aguardar promise rejeitada
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle missing account ID', () => {
      spyOn(mockAuthService, 'getAccountId').and.returnValue('mock-account-id');
      spyOn(console, 'error');
      
      dashboardService.connectToWebSocket();
      
      expect(console.error).toHaveBeenCalledWith('❌ Dashboard: AccountId não encontrado');
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limiting', () => {
      // Simular múltiplas chamadas rápidas
      const result1 = (socketService as any).checkRateLimit();
      const result2 = (socketService as any).checkRateLimit();
      
      expect(result1).toBeTruthy();
      expect(result2).toBeFalsy(); // Deve ser bloqueado por rate limiting
    });
  });

  describe('Cleanup', () => {
    it('should cleanup subscriptions on destroy', () => {
      spyOn(socketService, 'disconnect');
      
      dashboardService.cleanup();
      
      expect(socketService.disconnect).toHaveBeenCalled();
    });
  });
});
