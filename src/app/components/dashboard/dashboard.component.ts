import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

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
import { DashboardGatewayService } from '../../services/utils/gateways/dashboard-gateway.service';
import { MovementationService } from '../../services/movementation.service';

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
    private readonly dashboardGatewayService: DashboardGatewayService,
    private readonly authService: AuthService,
    readonly movementationService: MovementationService,
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

    this.dashboardService.$isLoading.subscribe(loading => {
      this.isLoading = loading;
    });

    this.dashboardService.$dashboardData.subscribe(data => {
      if (data && Object.keys(data).length > 0) {
        this.dashboardData = data;
      }
    });

    this.authService.$toggleLogin.subscribe({
      next: (isLoggedIn) => {
        if (isLoggedIn && this.authService.getAccountId()) {
          this.getData();
        } else {
          this.dashboardData = {} as DashboardModel;
        }
      }
    });

    this.subscribeToRefreshDashboard();
  }

  ngOnDestroy(): void {
    this.dashboardService.cleanup();
  }

  subscribeToRefreshDashboard(): void {
    this.dashboardGatewayService.onRefreshDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;

        this.dashboardService.setDashboardData(data);
      },
      error: (error) => {
        console.error('❌ Erro no subscription do refreshDashboard:', error);
      }
    });
  }

  getData(): void {
    const forceRefresh = !sessionStorage.getItem('dashboardData');

    this.dashboardService.getDashboardQuick(forceRefresh).subscribe({
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

    this.dashboardService.forceRefresh().subscribe((response) => {
      if (response.success) {
        console.log(`✅ Refresh iniciado: ${response.message}`);
        setTimeout(() => {
          this.getData();
          this.isLoadingRefresh = false;
        }, 2000);
      } else {
        console.error(`❌ Erro no refresh: ${response.message}`);
        this.isLoadingRefresh = false;
      }
    });
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
