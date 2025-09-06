import { Component, ElementRef, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FormsModule } from '@angular/forms';

import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

import { CheckCircle, CircleX, ClockAlert, ClockFading, Edit, LayoutGrid, List, LucideAngularModule, Mail, Search, Trash, Trash2, UserPlus } from 'lucide-angular';
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
    DatePipe,
    InfiniteScrollDirective,
    FormsModule
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
  readonly searchIcon = Search;
  readonly trashIcon = Trash2;

  @ViewChild('teamTable', { static: true }) teamTable!: ElementRef;
  @ViewChild('pendingInvitesCard', { static: true }) pendingInvitesCard!: ElementRef;

  tabView: { active: boolean, pending: boolean } = { active: true, pending: false };
  viewMode: { card: boolean, list: boolean } = { card: true, list: false };

  currentUser: AccountUserModel = new AccountUserModel();
  filteredTeamData: any[] = [];
  teamData: any;
  invitesData: any;
  hasNext: boolean = false;
  pageIndex: number = 1;
  pageSize: number = 10;
  loading: boolean = false;
  isSearching: boolean = false;
  searchTerm: string = '';
  private searchTimeout: any;

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
    this.teamService.getTeamData({ page: this.pageIndex, limit: this.pageSize, isIgnoringLoading: true }).subscribe({
      next: (data: any) => {
        this.teamData = data;
        this.filteredTeamData = [...this.teamData.data];
        this.hasNext = data.pagination.pages > 1;
        this.pageIndex = data.pagination.page;
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
    const isIgnoringLoading = true;
    if (isForcing) {
      this.fetchFreshPendingInvites(isIgnoringLoading);
      return;
    }

    this.teamService.$invitesData.subscribe((data: any) => {
      this.invitesData = data;
      this.hasNext = data.pagination.pages > 1;
      this.pageIndex = data.pagination.page;
    });

    if (this.invitesData?.length) return;

    this.fetchFreshPendingInvites(isIgnoringLoading);
  }

  /**
   * Obtém os dados dos convites atualizados
   */
  fetchFreshPendingInvites(isIgnoringLoading: boolean = false): void {
    const options = {
      page: this.pageIndex,
      limit: this.pageSize,
      isIgnoringLoading,
    }

    this.teamService.getPendingInvites(options).subscribe({
      next: (data: any) => {
        this.invitesData = data;
        this.hasNext = data.pagination.pages > 1;
        this.pageIndex = data.pagination.page;
      },
      error: (err) => {
        this.toast.error(err.error.message);
      }
    });
  }

  /**
   * Limpa os convites pendentes
   */
  onClearPendingInvites(): void {
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: isMobile ? '95vw' : '450px',
      maxWidth: isMobile ? '95vw' : '450px',
      panelClass: isMobile ? 'mobile-dialog' : 'confirmation-dialog',
      data: {
        title: 'Limpar Convites pendentes?',
        message: 'Tem certeza que deseja limpar os convites pendentes expirados com mais de 1 dia?',
        confirmText: 'Sim',
        cancelText: 'Não',
        confirmColor: 'red',
        icon: CircleX
      }
    });
    
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.teamService.clearPendingInvites().subscribe({
          next: () => {
            this.toast.success('Convites pendentes limpos com sucesso!');
          },
          error: (err) => {
            this.toast.error(err.error.message);
          }, 
          complete: () => {
            this.fetchFreshPendingInvites(true);
          }
        });
      }
    });
  }

  /**
   * Carrega mais convites pendentes
   */
  loadMoreInvites(): void {
    if (this.loading || !this.hasNext) return;

    this.loading = true;
    this.toast.info('Carregando mais convites pendentes...');

    const lastPage = this.pageIndex;
    const options = {
      page: lastPage + 1,
      limit: this.pageSize,
      isIgnoringLoading: true,
    }

    this.teamService.getPendingInvites(options).subscribe({
      next: (data: any) => {
        this.invitesData.data = [...this.invitesData.data, ...data.data];
        this.hasNext = data.pagination.pages > 1;
        this.pageIndex = data.pagination.page;
        this.loading = false;
      },
      error: (err) => {
        this.toast.error(err.error.message);
        this.loading = false;
      }
    });
  }

  /**
   * Carrega mais membros da equipe
   */
  loadMoreMembers(): void {
    if (this.loading || !this.hasNext) return;
    this.loading = true;
    this.toast.info('Carregando mais membros da equipe...');

    const lastPage = this.pageIndex;
    const options = {
      page: lastPage + 1,
      limit: this.pageSize,
      isIgnoringLoading: true,
    }

    this.teamService.getTeamData(options).subscribe({
      next: (data: any) => {
        this.teamData.data = [...this.teamData.data, ...data.data];
        this.filteredTeamData = [...this.filteredTeamData, ...data.data];
        this.hasNext = data.pagination.pages > 1;
        this.pageIndex = data.pagination.page;
        this.loading = false;
      },
      error: (err) => {
        this.toast.error(err.error.message);
        this.loading = false;
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

      this.fetchFreshPendingInvites(true);
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
            this.getTeamData(true);
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
            this.fetchFreshPendingInvites(true);
          },
          error: (err) => {
            this.toast.error(err.error.message);
          }
        });
      }
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
            this.fetchFreshPendingInvites(true);
          },
          error: (err) => {
            this.toast.error(err.error.message);
          }
        });
      }
    })
  }

  /**
   * Busca membros por nome ou email
   * @param event - Evento de busca
   */
  onSearchChange(event: any): void {
    this.searchTerm = event;
    this.debounceSearch();
  }

  /**
   * Busca membros por nome ou email com debounce de 0.5s
   * @param event - Evento de busca
   */
  private debounceSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      if (!this.searchTerm.trim()) {
        this.filteredTeamData = [...this.teamData.data];
        return;
      }

      this.filteredTeamData = this.teamData.data.filter((member: any) =>
        member.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        member.function?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }, 500);
  }
}
