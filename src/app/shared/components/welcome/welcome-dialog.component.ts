import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';
import { MatIcon } from "@angular/material/icon";
import { Package, LucideAngularModule, ArrowRight, ArrowLeft, Heart, Settings, TrendingUp, Users, CheckCircle, Star } from 'lucide-angular';

@Component({
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatRippleModule, MatIcon, LucideAngularModule],
  selector: 'app-welcome-dialog',
  templateUrl: './welcome-dialog.component.html',
  styleUrls: ['./welcome-dialog.component.scss']
})
export class WelcomeDialogComponent {
  readonly packageIcon = Package;
  readonly arrowLeftIcon = ArrowLeft;
  readonly arrowRightIcon = ArrowRight
  readonly heartIcon = Heart
  readonly usersIcon = Users;
  readonly trendingUpIcon = TrendingUp;
  readonly settingsIcon = Settings;
  readonly checkCircleIcon = CheckCircle;
  readonly starIcon = Star;

  currentStep: number = 1;

  welcomeSteps = [
    {
      title: 'Seja muito bem-vindo(a)! 🎉',
      description: 'Que alegria ter você aqui conosco!'
    },
    {
      title: 'Sua plataforma, suas regras! ⚡',
      description: 'Tudo foi pensado para facilitar sua vida'
    },
    {
      title: 'Vamos configurar sua conta? 🛠️',
      description: 'Só mais alguns detalhes para deixar tudo perfeito!'
    }
  ]

  constructor(
    public dialogRef: MatDialogRef<WelcomeDialogComponent>,
    private router: Router
  ) {}

  previousStep(): void {
    this.currentStep--;
  }

  nextStep(): void {
    this.currentStep++;
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings/account']);
    this.dialogRef.close();
  }
} 