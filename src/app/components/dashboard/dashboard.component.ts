import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  LucideAngularModule,
  AlertCircle,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Search,
  ShoppingCart,
  FileText,
  Plus,
  Eye,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardModel } from '../../models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';
import { ProductFormComponent } from '../products/product-form/product-form.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WelcomeDialogComponent } from '../../shared/components/welcome/welcome-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  readonly packageIcon = Package;
  readonly arrowDownIcon = TrendingUp;
  readonly arrowUpIcon = TrendingDown;
  readonly alertCircleIcon = AlertCircle;
  readonly chartIcon = BarChart3;
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
  dashboardData!: DashboardModel

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngAfterViewInit(): void {
    if (this.isFirstLogin && !this.hasShownWelcomeModal) {
      this.hasShownWelcomeModal = true;
      const dialogRef = this.dialog.open(WelcomeDialogComponent);

      dialogRef.afterClosed().subscribe(() => {
        this.isFirstLogin = false;
      });
    }
  }

  ngOnInit(): void {
    this.authService.$firstAccess.subscribe(data => {
      this.isFirstLogin = data && !this.hasShownWelcomeModal;
    })
    
    this.getData();
  }

  getData(): void {
    this.dashboardService.getDashboardData().subscribe((data) => {
      this.dashboardData = data
    })
  }

  onAddProduct(): void {
    const dialogRef = this.dialog.open(ProductFormComponent, { minWidth: '900px' });

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
    // TODO: Implementar detalhes da movimentação
    console.log('Ver detalhes clicado');
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
