import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { CircleUserRound, LogOut, LucideAngularModule, ChevronDown, PanelLeft, Wallet } from 'lucide-angular';

import { AuthService } from '../../services/auth.service';
import { SidenavService } from '../../services/sidenav.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, LucideAngularModule, MatMenuModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  readonly logOutIcon = LogOut;
  readonly userIcon = CircleUserRound
  readonly chevronDownIcon = ChevronDown;
  readonly menuIcon = PanelLeft;
  readonly financialIcon = Wallet;

  @Output() toggleSidenav = new EventEmitter<void>()

  userName!: string;
  userImage!: string;
  isLogged: boolean = false;

  constructor(
    readonly authService: AuthService,
    readonly sidenavService: SidenavService
  ) { }

  ngOnInit(): void {
    this.authService.$toggleLogin.subscribe((isLogged) => {
      this.isLogged = isLogged
      this.getUserImage()

      if (isLogged) {
        this.toggleSidenav.emit()
      }
    })

    this.authService.$userName.subscribe((userName) => {
      this.userName = userName || 'Fulano'
    })
  }

  /**
   * Obtém a imagem do usuário
   */
  getUserImage(): void {
    const remeberMe = this.authService.rememberMe();

    this.userImage = remeberMe ? localStorage.getItem('user_image') || '' : sessionStorage.getItem('user_image') || '';
  }

  /**
   * Realiza o logout do usuário
   */
  logout(): void {
    this.authService.logout()
    this.toggleSidenav.emit();
  }
}
