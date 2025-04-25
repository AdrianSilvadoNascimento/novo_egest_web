import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { LucideAngularModule, Home, User } from 'lucide-angular';
import { LoadingComponent } from "./components/loading/loading.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule, RouterLink, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'egest_estoque_web';
  readonly HomeIcon = Home;
  readonly UserIcon = User;
}
