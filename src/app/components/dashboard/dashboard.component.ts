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

  constructor(private readonly dashboardService: DashboardService) {

  }

  ngOnInit(): void {
    this.dashboardService.getDashboardData().subscribe((data) => {
      this.dashboardData = data
    })
  }
}
