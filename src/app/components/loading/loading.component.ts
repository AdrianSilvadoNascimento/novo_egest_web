import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';

import { LoadingService } from '../../services/loading.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule, NgIf, CommonModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent {
  constructor(public loadingService: LoadingService) { }
}
