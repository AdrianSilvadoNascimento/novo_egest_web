import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private snackBar: MatSnackBar) { }

  success(message: string) {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['bg-green-500', 'text-white', 'font-bold', 'text-center'],
    });
  }

  error(message: string) {
    this.snackBar.open(message, 'Fechar', {
      duration: 4000,
      panelClass: ['bg-red-500', 'text-white', 'font-bold', 'text-center'],
    });
  }

  info(message: string) {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['bg-blue-500', 'text-white', 'font-bold', 'text-center'],
    });
  }
}
