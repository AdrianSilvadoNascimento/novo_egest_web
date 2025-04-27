import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Home,
  Package,
  Settings,
  NotebookTabs,
  FileChartColumn,
  LucideIconData
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatIconModule,
    RouterModule,
    LucideAngularModule,
    MatTooltipModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent implements OnInit {
  @Input() expanded: boolean = true;

  links: { route: string, label: string, icon: LucideIconData }[] = [
    { route: '/dashboard', label: 'Dashboard', icon: Home },
    { route: '/products', label: 'Products', icon: Package },
    { route: '/customers', label: 'Customers', icon: NotebookTabs },
    { route: '/reports', label: 'Reports', icon: FileChartColumn },
    { route: '/settings', label: 'Settings', icon: Settings },
  ]

  isLogged: boolean = false;

  constructor(private readonly authService: AuthService) { }

  ngOnInit(): void {
    this.authService.$toggleLogin.subscribe((isLogged) => {
      this.isLogged = isLogged
    })
  }
}
