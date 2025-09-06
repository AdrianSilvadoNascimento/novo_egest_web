import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { MatCard } from "@angular/material/card";
import { Check } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-accepted',
  standalone: true,
  imports: [MatCard, LucideAngularModule],
  templateUrl: './accepted.component.html',
  styleUrl: './accepted.component.scss'
})
export class AcceptedComponent {
  readonly checkIcon = Check;

  constructor(private readonly router: Router) {}

  onAccessSystem(): void {
    this.router.navigate(['/login']);
  }
}
