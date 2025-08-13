import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule } from "lucide-angular";

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'red' | 'green' | 'blue';
  icon?: any;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    LucideAngularModule
],
  template: `
    <div class="dialog-container">
      <!-- Header gradient -->
      <div class="relative bg-gradient-to-r from-[#3377bc] to-[#2a5f9a] p-6 text-white">
        <div class="text-center mt-4">
          @if (data.icon) {
            <lucide-icon [img]="data.icon" class="mx-auto h-12 w-12 mb-2 opacity-80" [class]="confirmBtnColor"></lucide-icon>
          }
          <div class="text-2xl text-white font-semibold font-[Lora]">{{ data.title }}</div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <div mat-dialog-content class="mb-6 text-center">
          <p class="text-gray-700 text-lg m-0">{{ data.message }}</p>
        </div>
        
        <hr class="mb-4">

        <!-- Actions -->
        <div class="flex flex-row justify-end gap-2">
          <button (click)="onCancel()" class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            {{ data.cancelText || 'Cancelar' }}
          </button>
          <button type="submit" (click)="onConfirm()" class="bg-[#3377bc] text-white inline-flex gap-2 items-center px-4 py-2 text-sm font-medium rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            {{ data.confirmText || 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      border-radius: 8px;
      overflow: hidden;
      min-width: 400px;
    }
    
    .dialog-container .bg-gradient-to-r {
      margin: -24px -24px 0 -24px;
    }
    
    ::ng-deep .mat-mdc-dialog-container {
      padding: 0 !important;
    }
  `]
})
export class ConfirmationDialogComponent implements OnInit {
  confirmBtnColor: string = '';
  
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  ngOnInit(): void {
    this.confirmBtnColor = this.data.confirmColor === 'red' ? 'text-red-500' : 'text-green-500';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
