import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';

import {
  AlertCircle,
  Package,
  TrendingUp,
  TrendingDown,
  Search,
  ShoppingCart,
  FileText,
  Plus,
  Eye,
  Calendar,
  ArrowUp,
  ArrowDown,
  ChartColumn,
} from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DashboardModel } from '../../models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';
import { ProductFormComponent } from '../products/product-form/product-form.component';
import { AuthService } from '../../services/auth.service';
import { WelcomeDialogComponent } from '../../shared/components/welcome/welcome-dialog.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ItemCreationModel } from '../../models/item-creation.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly packageIcon = Package;
  readonly arrowDownIcon = TrendingUp;
  readonly arrowUpIcon = TrendingDown;
  readonly alertCircleIcon = AlertCircle;
  readonly chartIcon = ChartColumn;
  readonly searchIcon = Search;
  readonly cartIcon = ShoppingCart;
  readonly fileIcon = FileText;
  readonly plusIcon = Plus;
  readonly eyeIcon = Eye;
  readonly calendarIcon = Calendar;
  readonly arrowUpActivityIcon = ArrowUp;
  readonly arrowDownActivityIcon = ArrowDown;

  isFirstLogin: boolean = false;
  private hasShownWelcomeModal: boolean = false;
  dashboardData!: DashboardModel;
  isLoading: boolean = false;
  isLoadingRefresh: boolean = false;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) { }

  ngAfterViewInit(): void {
    if (this.isFirstLogin && !this.hasShownWelcomeModal) {
      this.hasShownWelcomeModal = true;
      const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
      const dialogRef = this.dialog.open(WelcomeDialogComponent, {
        panelClass: isMobile ? 'mobile-dialog' : 'modern-dialog',
        width: isMobile ? '95vw' : '600px',
        maxWidth: isMobile ? '95vw' : '600px',
        height: 'auto',
        maxHeight: '95vh',
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(() => {
        this.isFirstLogin = false;
      });
    }
  }

  ngOnInit(): void {
    this.authService.$firstAccess.subscribe(data => {
      this.isFirstLogin = data && !this.hasShownWelcomeModal;
    })

    // Subscrever aos loading states
    this.dashboardService.$isLoading.subscribe(loading => {
      this.isLoading = loading;
    });

    // Subscrever ao status da conexão WebSocket
    this.dashboardService.$connectionStatus.subscribe(status => {
      console.log(`📡 Dashboard: Status conexão WebSocket: ${status}`);
    });

    // Subscrever aos dados do dashboard
    this.dashboardService.$dashboardData.subscribe(data => {
      if (data && Object.keys(data).length > 0) {
        this.dashboardData = data;
      }
    });

    this.authService.$toggleLogin.subscribe({
      next: (isLoggedIn) => {
        if (isLoggedIn && this.authService.getAccountId()) {
          this.getData();
          this.connectToRealTimeUpdates();
        } else {
          this.dashboardData = {} as DashboardModel;
          this.dashboardService.disconnectFromWebSocket();
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup quando componente é destruído
    this.dashboardService.cleanup();
  }

  getData(): void {
    // Usar método otimizado com cache Redis
    this.dashboardService.getDashboardQuick().subscribe({
      next: (data) => {
        this.dashboardData = data;
      },
      error: (error) => {
        console.error('❌ Erro ao buscar dados do dashboard:', error);
      }
    });
  }

  refreshData(): void {
    this.isLoadingRefresh = true;
    
    // Tentar usar WebSocket primeiro, fallback para API
    if (this.dashboardService.isConnectedToUpdates()) {
      console.log('🔄 Dashboard: Solicitando refresh via WebSocket');
      this.dashboardService.requestWebSocketRefresh(true);
      // WebSocket não retorna resposta imediata, resetar loading após delay
      setTimeout(() => {
        this.isLoadingRefresh = false;
      }, 1000);
    } else {
      console.log('🔄 Dashboard: WebSocket não disponível, usando API');
      // Usar método de refresh forçado via API
      this.dashboardService.forceRefresh().subscribe((response) => {
        if (response.success) {
          console.log(`✅ Refresh iniciado: ${response.message}`);
        } else {
          console.error(`❌ Erro no refresh: ${response.message}`);
        }
        this.isLoadingRefresh = false;
      });
    }
  }

  /**
   * Conecta aos updates em tempo real via WebSocket
   */
  private connectToRealTimeUpdates(): void {
    // Conectar ao WebSocket
    this.dashboardService.connectToWebSocket();
    
    // Os eventos WebSocket são processados automaticamente no service
    // Não precisamos de subscription manual aqui
    console.log('📡 Dashboard: Conectando ao WebSocket para updates em tempo real');
  }

  /**
   * Obtém informações da conexão WebSocket
   */
  getWebSocketInfo(): { isConnected: boolean; status: string } {
    let status = '';
    this.dashboardService.$connectionStatus.subscribe(status => status);
    return {
      isConnected: this.dashboardService.isConnectedToUpdates(),
      status,
    };
  }

  /**
   * Reconecta ao WebSocket se necessário
   */
  reconnectWebSocket(): void {
    console.log('🔄 Dashboard: Reconectando WebSocket...');
    this.dashboardService.disconnectFromWebSocket();
    setTimeout(() => {
      this.dashboardService.connectToWebSocket();
    }, 1000);
  }

  onAddProduct(): void {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      minWidth: '900px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getData();

      if (result) {
        this.router.navigate(['/products']);
      } else {
        if (!sessionStorage.getItem('product_form_draft')) {
          sessionStorage.removeItem('product_form_draft');
        }
      }
    });
  }

  onSearchProduct(): void {
    this.router.navigate(['/products']);
  }

  onNewSale(): void {
    // TODO: Implementar funcionalidade de nova venda
    console.log('Nova venda clicada');
  }

  onViewReports(): void {
    // TODO: Implementar navegação para relatórios
    console.log('Relatórios clicado');
  }

  onViewDetails(): void {
    this.router.navigate(['/movementations']);
  }

  getMaxValue(movement: any[]): number {
    if (!movement || movement.length === 0) return 100;
    return Math.max(...movement.map(item => Math.max(item.entries, item.exits)));
  }

  onViewAllLowStock(): void {
    // TODO: Implementar navegação para produtos com baixo estoque
    console.log('Ver todos os produtos com baixo estoque');
  }

  onViewHistory(): void {
    // TODO: Implementar navegação para histórico de atividades
    console.log('Ver histórico de atividades');
  }
}
