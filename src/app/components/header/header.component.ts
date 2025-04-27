import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { CircleUserRound, LogOut, LucideAngularModule, PanelLeft } from 'lucide-angular';

import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, LucideAngularModule, MatMenuModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  readonly menuIcon = PanelLeft;
  readonly logOutIcon = LogOut; // Use the appropriate icon for logout
  readonly userIcon = CircleUserRound
  @Output() toggleSidenav = new EventEmitter<void>()

  userName!: string;
  isLogged: boolean = false;

  constructor(private readonly authService: AuthService) { }

  ngOnInit(): void {
    this.authService.$toggleLogin.subscribe((isLogged) => {
      this.isLogged = isLogged

      if (isLogged) {
        this.toggleSidenav.emit()
      }
    })

    this.authService.$userName.subscribe((userName) => {
      this.userName = userName || 'Fulano'
    })
  }

  logout(): void {
    this.authService.logout()
    this.toggleSidenav.emit();
  }
}
