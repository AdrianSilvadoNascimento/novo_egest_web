import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { CheckCircle, CircleX, ClockAlert, ClockFading, Edit, LayoutGrid, List, LucideAngularModule, Mail, Trash, UserPlus } from 'lucide-angular';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs'
import { MatCard } from "@angular/material/card";
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';

import { TeamService } from '../../services/team.service';
import { UtilsService } from '../../services/utils/utils.service';
import { ValidateUserService } from '../../services/utils';
import { AccountUserModel } from '../../models/account_user.model';
import { AccountUserService } from '../../services/account-user.service';
import { TeamFormComponent } from './team-form/team-form.component';
import { ToastService } from '../../services/toast.service';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { InviteStatus } from '../../models/invite.model';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatIcon,
    MatButtonModule,
    MatTooltipModule,
    MatTabsModule,
    MatCard,
    MatButtonToggleModule,
    MatMenuModule,
    DatePipe
  ],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss'
})
export class TeamComponent {
  readonly addIcon = UserPlus;
  readonly cardIcon = LayoutGrid;
  readonly listIcon = List;
  readonly editIcon = Edit;
  readonly deleteIcon = Trash;
  readonly mailIcon = Mail;
  readonly clockIcon = ClockFading;
  readonly clockAlertIcon = ClockAlert;
  readonly checkIcon = CheckCircle;
  readonly cancelIcon = CircleX;

  tabView: { active: boolean, pending: boolean } = { active: true, pending: false };
  viewMode: { card: boolean, list: boolean } = { card: true, list: false };

  currentUser: AccountUserModel = new AccountUserModel();
  teamData: any;
  invitesData: any;

  constructor(
    private readonly accountUserService: AccountUserService,
    private readonly teamService: TeamService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly dialog: MatDialog,
    private readonly toast: ToastService,
    readonly utilsService: UtilsService,
    readonly validateUserService: ValidateUserService
  ) { }

  ngOnInit(): void {
    this.tabView.active = true;
    this.viewMode.card = true;
    this.getTeamData(true);
    this.getCurrentUser();
    this.getPendingInvites(true);
  }

  /**
   * Obtém os dados do usuário atual
   */
  getCurrentUser(): void {
    this.accountUserService.$accountUserData.subscribe((user: AccountUserModel) => {
      this.currentUser = user;
    });

    if (this.currentUser.id) return;

    this.accountUserService.getAccountUser().subscribe((user: AccountUserModel) => {
      this.currentUser = user;
    });
  }

  /**
   * Obtém os dados da equipe
   */
  getTeamData(isForcing: boolean = false): void {
    if (isForcing) {
      this.fetchFreshTeamData();
      return;
    }

    this.teamService.$teamData.subscribe((data: any) => {
      this.teamData = data;
    });

    if (this.teamData?.length) return;

    this.fetchFreshTeamData();
  }

  /**
   * Obtém os dados da equipe atualizados
   */
  fetchFreshTeamData(): void {
    this.teamService.getTeamData().subscribe({
      next: (data: any) => {
        this.teamData = data;
      },
      error: (err) => {
        this.toast.error(err.error.message);
      }
    });
  }

  /**
   * Obtém o ícone do convite
   * @param status - Status do convite
   * @returns Ícone do convite
   */
  getInviteIcon(status: InviteStatus): any {
    switch (status) {
      case InviteStatus.PENDING:
        return this.clockIcon;
      case InviteStatus.ACCEPTED:
        return this.checkIcon;
      case InviteStatus.EXPIRED:
        return this.clockAlertIcon;
      case InviteStatus.CANCELLED:
        return this.cancelIcon;
      default:
        return this.clockIcon;
    }
  }

  /**
   * Verifica se o convite está pendente
   * @param status - Status do convite
   * @returns true se o convite está pendente
   */
  isPendingInvite(status: InviteStatus): boolean {
    return status === InviteStatus.PENDING;
  }

  /**
   * Verifica se o convite está expirado
   * @param status - Status do convite
   * @returns true se o convite está expirado
   */
  isExpiredInvite(status: InviteStatus): boolean {
    return status === InviteStatus.EXPIRED;
  }

  /**
   * Obtém os dados dos convites
   */
  getPendingInvites(isForcing: boolean = false): void {
    if (isForcing) {
      this.fetchFreshPendingInvites();
      return;
    }

    this.teamService.$invitesData.subscribe((data: any) => {
      this.invitesData = data;
    });

    if (this.invitesData?.length) return;

    this.fetchFreshPendingInvites();
  }

  /**
   * Obtém os dados dos convites atualizados
   */
  fetchFreshPendingInvites(): void {
    this.teamService.getPendingInvites().subscribe({
      next: (data: any) => {
        this.invitesData = data;
      },
      error: (err) => {
        this.toast.error(err.error.message);
      }
    });
  }

  /**
   * Obtém iniciais do membro
   */
  getMemberInitials(memberName: string): string {
    let initials = '';

    const names = memberName.split(' ');
    initials = `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();

    return initials;
  }

  /**
   * Invita um usuário para a equipe
   */
  onInviteUser(): void {
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    const dialogRef = this.dialog.open(TeamFormComponent, {
      data: { member: new AccountUserModel(), isEdit: false },
      panelClass: isMobile ? 'mobile-dialog' : 'modern-dialog',
      width: isMobile ? '95vw' : '600px',
      maxWidth: isMobile ? '95vw' : '600px',
    });

    dialogRef.afterClosed().subscribe((result: AccountUserModel | undefined) => {
      if (!result) return;

      this.toast.success('Membro convidado com sucesso!');

      this.getTeamData(true);
    })
  }

  /**
   * Alterna o modo de visualização entre card e list
   * @param mode - 'card' ou 'list'
   */
  toggleViewMode(mode: 'card' | 'list'): void {
    this.viewMode.card = false;
    this.viewMode.list = false;
    this.viewMode[mode] = true;
  }

  /**
   * Alterna a visualização entre tab ativa e pendente
   * @param mode 
   */
  toggleTabView(mode: 'active' | 'pending'): void {
    this.tabView.active = false;
    this.tabView.pending = false;
    this.tabView[mode] = true;
  }

  /**
   * Edita um membro da equipe
   * @param member - O membro a ser editado
   */
  onEditMember(member: any): void {
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    const dialogRef = this.dialog.open(TeamFormComponent, {
      data: { member, isEdit: true },
      panelClass: isMobile ? 'mobile-dialog' : 'modern-dialog',
      width: isMobile ? '95vw' : '600px',
      maxWidth: isMobile ? '95vw' : '600px',
    });

    dialogRef.afterClosed().subscribe((result: AccountUserModel | undefined) => {
      if (!result) return;

      this.toast.success('Membro atualizado com sucesso!');

      this.getTeamData(true);
    })
  }

  /**
   * Exclui um membro da equipe
   * @param member - O membro a ser excluído
   */
  onDeleteMember(member: any): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'confirmation-dialog',
      data: {
        title: 'Excluir Membro',
        message: 'Tem certeza que deseja excluir o membro?',
        confirmText: 'Sim',
        cancelText: 'Não',
        confirmColor: 'red',
        icon: CircleX
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.teamService.deleteMember(member.id).subscribe({
          next: () => {
            this.toast.success('Membro excluído com sucesso!');
          },
          error: (err) => {
            this.toast.error(err.error.message);
          }
        });
      }
    })
  }

  /**
   * Cancela um convite
   * @param inviteId - O ID do convite a ser cancelado
   */
  onCancelInvite(inviteId: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'confirmation-dialog',
      data: {
        title: 'Cancelar Convite',
        message: 'Tem certeza que deseja cancelar o convite?',
        confirmText: 'Sim',
        cancelText: 'Não',
        confirmColor: 'red',
        icon: CircleX
      }
    })

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.teamService.cancelInvite(inviteId).subscribe({
          next: () => {
            this.toast.success('Convite cancelado com sucesso!');
          },
          error: (err) => {
            this.toast.error(err.error.message);
          }
        });
      }

      this.getPendingInvites(true);
    })
  }

  /**
   * Reenvia um convite
   * @param inviteId - O ID do convite a ser reenviado
   */
  onResendInvite(inviteId: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'confirmation-dialog',
      data: {
        title: 'Reenviar Convite',
        message: 'Deseja reenviar o convite?',
        confirmText: 'Sim',
        cancelText: 'Não',
        confirmColor: 'green',
        icon: CheckCircle
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.teamService.resendInvite(inviteId).subscribe({
          next: () => {
            this.toast.success('Convite reenviado com sucesso!');
          },
          error: (err) => {
            this.toast.error(err.error.message);
          }
        });
      }

      this.getPendingInvites(true);
    })
  }
}
