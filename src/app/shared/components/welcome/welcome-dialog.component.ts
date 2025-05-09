import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';

@Component({
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatRippleModule, RouterLink],
  selector: 'app-welcome-dialog',
  templateUrl: './welcome-dialog.component.html',
  styleUrls: ['./welcome-dialog.component.scss']
})
export class WelcomeDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<WelcomeDialogComponent>
  ) {}
} 