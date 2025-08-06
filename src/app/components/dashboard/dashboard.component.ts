import { AfterViewInit, Component, OnInit } from '@angular/core';

import {
  LucideAngularModule,
  ArrowDown,
  ArrowUp,
  AlertCircle,
  PackagePlus,
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
  imports: [LucideAngularModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  readonly packageIcon = PackagePlus;
  readonly arrowDownIcon = ArrowDown;
  readonly arrowUpIcon = ArrowUp;
  readonly alertCircleIcon = AlertCircle;

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
}
