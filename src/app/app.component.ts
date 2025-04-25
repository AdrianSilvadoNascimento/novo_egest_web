import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LucideAngularModule, Home, User } from 'lucide-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'egest_estoque_web';
  readonly HomeIcon = Home;
  readonly UserIcon = User;
}
