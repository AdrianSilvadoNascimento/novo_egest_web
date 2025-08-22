import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

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
  Tag,
  TrendingUpDown
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { SidenavService } from '../../services/sidenav.service';

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
export class SidenavComponent implements OnInit, OnDestroy {
  readonly menuIcon = PanelLeft;

  expanded: boolean = false;
  isLogged: boolean = false;
  isMobile: boolean = false;
  mode: 'side' | 'over' = 'side';
  opened: boolean = true;

  private subscriptions: Subscription[] = [];

  links: { route: string, label: string, icon: LucideIconData }[] = [
    { route: '/home', label: 'Dashboard', icon: Home },
    { route: '/products', label: 'Produtos', icon: Package },
    { route: '/movementations', label: 'Movimentações', icon: TrendingUpDown },
    { route: '/categories', label: 'Categorias', icon: Tag },
    { route: '/customers', label: 'Clientes', icon: NotebookTabs },
    { route: '/reports', label: 'Relatórios', icon: FileChartColumn },
    { route: '/settings', label: 'Configurações', icon: Settings },
  ]

  constructor(
    private readonly authService: AuthService,
    private readonly sidenavService: SidenavService,
    private readonly breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.setupResponsiveBehavior();
  }

  /**
   * Configura as subscrições para os estados do sidenav
   */
  private setupSubscriptions(): void {
    const loginSub = this.authService.$toggleLogin.subscribe((isLogged) => {
      this.isLogged = isLogged;
    });

    const expandedSub = this.sidenavService.expanded$.subscribe((expanded) => {
      this.expanded = expanded;
    });

    const mobileSub = this.sidenavService.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });

    const modeSub = this.sidenavService.mode$.subscribe((mode) => {
      this.mode = mode;
    });

    const openedSub = this.sidenavService.opened$.subscribe((opened) => {
      this.opened = opened;
    });

    this.subscriptions.push(loginSub, expandedSub, mobileSub, modeSub, openedSub);
  }

  /**
   * Configura o comportamento responsivo do sidenav
   */
  private setupResponsiveBehavior(): void {
    const breakpointSub = this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        const isMobile = result.matches;
        this.sidenavService.setMobile(isMobile);

        if (isMobile) {
          this.sidenavService.setMode('over');
          this.sidenavService.setOpened(false);
          this.sidenavService.setExpanded(true);
        } else {
          this.sidenavService.setMode('side');
          this.sidenavService.setOpened(true);
        }
      });

    this.subscriptions.push(breakpointSub);
  }

  /**
   * Calcula a largura do sidenav baseado no estado atual
   */
  getSidenavWidth(): string {
    if (this.isMobile) {
      return '250px';
    }

    return this.expanded ? '250px' : '80px';
  }

  /**
   * Controla o toggle do sidenav (usado pelo botão interno)
   */
  toggleSidenav(): void {
    this.sidenavService.toggle();
  }

  /**
   * Fecha o sidenav quando um link é clicado (usado principalmente em mobile)
   */
  onLinkClick(): void {
    if (this.isMobile) {
      this.sidenavService.close();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
