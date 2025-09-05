import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MatCard } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { LucideAngularModule, Mail, Building2, AlertCircle, Info } from 'lucide-angular';

import { InviteService } from '../../../services/invite.service';
import { UtilsService } from '../../../services/utils/utils.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-valid-token',
  standalone: true,
  imports: [MatCard, LucideAngularModule, DatePipe, MatProgressSpinner],
  templateUrl: './valid-token.component.html',
  styleUrl: './valid-token.component.scss'
})
export class ValidTokenComponent {
  readonly mailIcon = Mail;
  readonly buildingIcon = Building2;
  readonly alertCircleIcon = AlertCircle;
  readonly infoIcon = Info;

  isLoading: { loading: boolean, action: 'reject' | 'accept' } = { loading: false, action: 'reject' };

  @Input() data: any = {};
  @Output() onRejectInvite = new EventEmitter<void>();
  @Output() onAcceptInvite = new EventEmitter<void>();

  constructor(
    private readonly inviteService: InviteService,
    readonly utilsService: UtilsService,
    private readonly dialog: MatDialog,
    private readonly toastService: ToastService,
    private readonly breakpointObserver: BreakpointObserver
  ) { }

  /**
   * Rejeitar convite
   */
  rejectInvite(): void {
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: isMobile ? '95vw' : '600px',
      maxWidth: isMobile ? '95vw' : '600px',
      panelClass: isMobile ? 'mobile-dialog' : 'modern-dialog',
      data: {
        title: 'Rejeitar Convite',
        message: 'Tem certeza que deseja rejeitar este convite?',
        confirmText: 'Rejeitar',
        cancelText: 'Cancelar',
        confirmColor: 'red',
        icon: this.alertCircleIcon
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.isLoading = { loading: true, action: 'reject' };

      this.inviteService.rejectInvite(this.data.invite.id).subscribe({
        next: () => {
          this.toastService.success('Convite rejeitado com sucesso!');
          this.isLoading = { loading: false, action: 'reject' };
          this.onRejectInvite.emit();
        },
        error: () => {
          this.toastService.error('Erro ao rejeitar convite!');
          this.isLoading = { loading: false, action: 'reject' };
        }
      });
    });
  }
}
