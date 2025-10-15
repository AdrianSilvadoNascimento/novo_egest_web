import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LucideAngularModule, Home, User } from 'lucide-angular';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from "./components/header/header.component";
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { LoadingComponent } from './components/loading/loading.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    LucideAngularModule,
    HeaderComponent,
    LoadingComponent,
    MatSidenavModule,
    SidenavComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'egest_estoque_web';
  readonly HomeIcon = Home;
  readonly UserIcon = User;

  isLogged: boolean = false;

  constructor(
    private readonly authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.$toggleLogin.subscribe((isLogged) => {
      this.isLogged = isLogged;
    });
  }
}
