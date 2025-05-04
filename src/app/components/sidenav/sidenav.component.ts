import { Component, OnInit } from '@angular/core';
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
  LucideIconData,
  PanelLeft,
  Tag
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
    MatTooltipModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent implements OnInit {
  readonly menuIcon = PanelLeft;

  expanded: boolean = true;
  isLogged: boolean = false;

  links: { route: string, label: string, icon: LucideIconData }[] = [
    { route: '/home', label: 'Dashboard', icon: Home },
    { route: '/products', label: 'Products', icon: Package },
    { route: '/categories', label: 'Categories', icon: Tag },
    { route: '/customers', label: 'Customers', icon: NotebookTabs },
    { route: '/reports', label: 'Reports', icon: FileChartColumn },
    { route: '/settings', label: 'Settings', icon: Settings },
  ]

  constructor(private readonly authService: AuthService) { }

  ngOnInit(): void {
    this.authService.$toggleLogin.subscribe((isLogged) => {
      this.isLogged = isLogged
    })
  }
}
