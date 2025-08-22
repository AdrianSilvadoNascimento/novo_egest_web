import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog.component';
import { Observable } from 'rxjs';

export interface ConfirmationDialogOptions extends ConfirmationDialogData {
  showCancel?: boolean;
  type?: 'info' | 'warning' | 'error' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {

  constructor(private dialog: MatDialog) { }

  /**
   * Abre o dialog de confirmação
   * @param options Opções de configuração do dialog
   * @returns Observable que emite true quando confirmado, false quando cancelado
   */
  open(options: ConfirmationDialogOptions): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        confirmColor: this.getConfirmColor(options.type),
        icon: this.getIcon(options.type),
        showCancel: options.showCancel !== false
      }
    });

    return dialogRef.afterClosed();
  }

  /**
   * Abre um dialog informativo (sem botão cancelar)
   * @param options Opções do dialog
   * @returns Observable que emite true quando fechado
   */
  openInfo(options: Omit<ConfirmationDialogOptions, 'showCancel'>): Observable<boolean> {
    return this.open({
      ...options,
      showCancel: false,
      type: 'info'
    });
  }

  /**
   * Abre um dialog de aviso
   * @param options Opções do dialog
   * @returns Observable que emite true quando confirmado, false quando cancelado
   */
  openWarning(options: ConfirmationDialogOptions): Observable<boolean> {
    return this.open({
      ...options,
      type: 'warning'
    });
  }

  /**
   * Abre um dialog de erro
   * @param options Opções do dialog
   * @returns Observable que emite true quando confirmado, false quando cancelado
   */
  openError(options: ConfirmationDialogOptions): Observable<boolean> {
    return this.open({
      ...options,
      type: 'error'
    });
  }

  /**
   * Abre um dialog de sucesso
   * @param options Opções do dialog
   * @returns Observable que emite true quando confirmado, false quando cancelado
   */
  openSuccess(options: ConfirmationDialogOptions): Observable<boolean> {
    return this.open({
      ...options,
      type: 'success'
    });
  }

  /**
   * Retorna a cor do botão baseada no tipo
   */
  private getConfirmColor(type?: string): 'red' | 'green' | 'blue' {
    switch (type) {
      case 'error':
        return 'red';
      case 'success':
        return 'green';
      case 'warning':
        return 'red';
      default:
        return 'blue';
    }
  }

  /**
   * Retorna o ícone baseado no tipo
   */
  private getIcon(type?: string): any {
    // Por enquanto retorna undefined, mas pode ser expandido para incluir ícones específicos
    return undefined;
  }
}
