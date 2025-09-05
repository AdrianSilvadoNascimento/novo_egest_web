import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { InviteService } from '../../services/invite.service';
import { ERROR_MESSAGES, INVITE_STATUS } from '../../services/utils/constants/constants';
import { ToastService } from '../../services/toast.service';
import { InvalidTokenComponent } from "./invalid-token/invalid-token.component";
import { ValidTokenComponent } from "./valid-token/valid-token.component";

@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [InvalidTokenComponent, ValidTokenComponent],
  templateUrl: './invite.component.html',
  styleUrl: './invite.component.scss'
})
export class InviteComponent implements OnInit {
  errorMessages = ERROR_MESSAGES.INVITE_CONSTANTS;
  inviteToken: string = '';
  inviteStatus: string = '';
  expiresAt: Date = new Date();
  inviteData: any = {};

  constructor(
    private readonly route: ActivatedRoute,
    private readonly inviteService: InviteService,
    private readonly toastService: ToastService
  ) {
    this.route.params.subscribe(params => {
      this.inviteToken = params['token'];
    });
  }

  ngOnInit(): void {
    this.validateInviteToken();
  }

  /**
   * Valida o token de convite
   */
  validateInviteToken(): void {
    this.inviteService.validateInviteToken(this.inviteToken).subscribe({
      next: (res) => {
        this.inviteStatus = this.getInviteStatus(res.message);
        this.expiresAt = res.data.expiresAt;
        this.inviteData = res.data;
        console.log(res);

        if (!res.data.valid) {
          this.toastService.error(res.message);
        }
      },
      error: (err) => {
        console.log(err.error.message);
        this.toastService.error(err.error.message);
      }
    });
  }

  /**
   * Checa se o status do convite é válido
   */
  isInvalidInviteStatus(): boolean {
    return [
      INVITE_STATUS.EXPIRED.valueOf(),
      INVITE_STATUS.CANCELLED.valueOf(),
      INVITE_STATUS.REJECTED.valueOf(),
    ].includes(this.inviteStatus);
  }

  /**
   * Checa se o status do convite é pendente
   */
  isPendingInviteStatus(): boolean {
    return this.inviteStatus === INVITE_STATUS.PENDING;
  }

  /**
   * Status do convite
   * @param message - Mensagem do status do convite
   * @returns Status do convite
   */
  getInviteStatus(message: keyof typeof ERROR_MESSAGES.INVITE_CONSTANTS): string {
    switch(message) {
      case this.errorMessages.INVITE_EXPIRED:
        return INVITE_STATUS.EXPIRED as string;
      case this.errorMessages.INVITE_ALREADY_ACCEPTED:
        return INVITE_STATUS.ACCEPTED as string;
      case this.errorMessages.INVITE_CANCELLED:
        return INVITE_STATUS.CANCELLED as string;
      case this.errorMessages.INVITE_REJECTED:
        return INVITE_STATUS.REJECTED as string;
      default:
        return INVITE_STATUS.PENDING as string;
    }
  }

  /**
   * Rejeita o convite
   */
  onRejectInvite(): void {
    this.validateInviteToken();
  }
}
