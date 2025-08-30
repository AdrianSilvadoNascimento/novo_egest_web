import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { LucideAngularModule } from 'lucide-angular';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatLabel } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { AccountUserModel, AccountUserRole, AccountUserType } from '../../../models/account_user.model';
import { UtilsService } from '../../../services/utils/utils.service';
import { ValidateUserService } from '../../../services/utils/validate-user.service';
import { TeamService } from '../../../services/team.service';
import { ToastService } from '../../../services/toast.service';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [
    MatCard,
    ReactiveFormsModule,
    LucideAngularModule,
    MatIcon,
    MatDialogContent,
    MatFormFieldModule,
    MatInputModule,
    MatLabel,
    MatSelectModule,
    MatProgressSpinner
],
  templateUrl: './team-form.component.html',
  styleUrl: './team-form.component.scss'
})
export class TeamFormComponent {
  form: FormGroup = new FormGroup({});
  isInviting = false;

  types: AccountUserType[] = [
    AccountUserType.USER,
    AccountUserType.ADMIN,
  ];

  roles: AccountUserRole[] = [
    AccountUserRole.STORE_MANAGER,
    AccountUserRole.STOCKIST,
    AccountUserRole.CASHIER,
    AccountUserRole.SELLER
  ];

  constructor(
    private fb: FormBuilder,
    private readonly teamService: TeamService,
    private readonly toast: ToastService,
    public dialogRef: MatDialogRef<TeamFormComponent>,
    readonly utilsService: UtilsService,
    readonly validateUserService: ValidateUserService,
    @Inject(MAT_DIALOG_DATA) public data: { member: AccountUserModel, isEdit: boolean }
  ) { }

  ngOnInit(): void {
    if (this.data.isEdit) {
      this.createForm(this.data.member);
    } else {
      this.createForm(new AccountUserModel());
    }
  }

  /**
   * Cria o formulário de membro
   * @param member - Membro a ser criado
   */
  createForm(member: AccountUserModel): void {
    this.form = this.fb.group({
      email: [member.email, this.getTypeValidators(member.type)],
      type: [member.type, this.getTypeValidators(member.type)],
      role: [member.role, this.getTypeValidators(member.type)],
      id: [member.id],
    });
  }

  /**
   * Retorna os validadores para o campo type baseado no tipo do membro
   * @param memberType - Tipo do membro
   * @returns Array de validadores
   */
  private getTypeValidators(memberType: AccountUserType): any[] {
    if (!this.validateUserService.isOwner(memberType)) {
      return [Validators.required];
    }
    return [];
  }

  /**
   * Envia os dados do formulário de membro
   */
  sendData(): void {
    if (!this.data.isEdit) {
      this.createMember();
      return;
    }

    this.updateMember();
  }

  /**
   * Cria um membro
   */
  createMember(): void {
    this.isInviting = true;
    this.teamService.inviteMember(this.form.value).subscribe({
      next: (res) => {
        this.dialogRef.close(res);
        this.isInviting = false;
      },
      error: (err) => {
        this.toast.error(err.error.message);
        this.isInviting = false;
      }
    });
  }

  /**
   * Atualiza um membro
   */
  updateMember(): void {
    this.teamService.updateMember(this.form.value).subscribe({
      next: (res) => {
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.toast.error(err.error.message);
      }
    });
  }
}
