import { Component, OnInit } from '@angular/core';

import {
  LucideAngularModule,
  Package,
  ArrowDown,
  ArrowUp,
  AlertCircle,
} from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardModel } from '../../models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';
import { ProductFormComponent } from '../products/product-form/product-form.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LucideAngularModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  readonly packageIcon = Package;
  readonly arrowDownIcon = ArrowDown;
  readonly arrowUpIcon = ArrowUp;
  readonly alertCircleIcon = AlertCircle;

  dashboardData!: DashboardModel

  constructor(private readonly dashboardService: DashboardService, private dialog: MatDialog, private router: Router) { }

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    this.dashboardService.getDashboardData().subscribe((data) => {
      this.dashboardData = data
    })
  }

  onAddProduct(): void {
    const dialogRef = this.dialog.open(ProductFormComponent);

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
