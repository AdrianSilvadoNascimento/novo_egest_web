import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MatCard } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { LucideAngularModule, Mail, Building2, AlertCircle, Info, User, Eye, X, Check, EyeOff } from 'lucide-angular';

import { InviteService } from '../../../services/invite.service';
import { UtilsService } from '../../../services/utils/utils.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToastService } from '../../../services/toast.service';
import { MatError } from "@angular/material/form-field";

export interface AcceptInviteModel {
  name: string;
  lastname: string;
  password: string;
  password_confirmation: string;
}

@Component({
  selector: 'app-valid-token',
  standalone: true,
  imports: [MatCard, LucideAngularModule, DatePipe, MatProgressSpinner, ReactiveFormsModule, MatError],
  templateUrl: './valid-token.component.html',
  styleUrl: './valid-token.component.scss'
})
export class ValidTokenComponent {
  readonly mailIcon = Mail;
  readonly buildingIcon = Building2;
  readonly alertCircleIcon = AlertCircle;
  readonly infoIcon = Info;
  readonly userIcon = User;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly CheckIcon = Check;
  readonly XIcon = X;

  isAcceptingInvite: boolean = false;
  isLoading: { loading: boolean, action: 'reject' | 'accept' } = { loading: false, action: 'reject' };
  form: FormGroup = new FormGroup({});

  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';
  passwordCriteria = {
    hasLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  };
  showPassword = false;
  showPasswordConfirmation = false;

  @Input() data: any = {};
  @Output() onRejectInvite = new EventEmitter<void>();
  @Output() onAcceptInvite = new EventEmitter<void>();

  constructor(
    private readonly inviteService: InviteService,
    readonly utilsService: UtilsService,
    private readonly fb: FormBuilder,
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

  /**
   * Aceitar convite
   */
  acceptInvite(): void {
    this.isAcceptingInvite = true;
    this.createForm();
    this.setupPasswordValidation();
  }

  /**
   * Voltar para o estado anterior
   */
  goBack(): void {
    this.isAcceptingInvite = false;
  }

  /**
   * Cria o formulário de cadastro
   */
  createForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      lastname: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        this.passwordValidator()
      ]],
      password_confirmation: ['', [
        Validators.required,
        this.passwordConfirmationValidator()
      ]],
    }, { validators: this.passwordMatchValidator });
  }

  // Validador customizado para senha
  private passwordValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const password = control.value;
      const errors: ValidationErrors = {};

      if (password.length < 8) {
        errors['minLength'] = { requiredLength: 8, actualLength: password.length };
      }

      if (!/[A-Z]/.test(password)) {
        errors['noUppercase'] = true;
      }

      if (!/[a-z]/.test(password)) {
        errors['noLowercase'] = true;
      }

      if (!/\d/.test(password)) {
        errors['noNumber'] = true;
      }

      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors['noSpecial'] = true;
      }

      if (/\s/.test(password)) {
        errors['hasSpaces'] = true;
      }

      const commonSequences = ['123456', 'qwerty', 'password', 'admin', '123456789'];
      if (commonSequences.some(seq => password.toLowerCase().includes(seq))) {
        errors['commonSequence'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  // Validador para confirmação de senha
  private passwordConfirmationValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const password = this.form?.get('password')?.value;
      const confirmation = control.value;

      return password === confirmation ? null : { passwordMismatch: true };
    };
  }

  // Validador para verificar se as senhas coincidem
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password');
    const confirmation = group.get('password_confirmation');

    if (!password || !confirmation) return null;

    return password.value === confirmation.value ? null : { passwordMismatch: true };
  }

  // Configurar validação em tempo real da senha
  private setupPasswordValidation(): void {
    const passwordControl = this.form.get('password');
    if (passwordControl) {
      passwordControl.valueChanges.subscribe(password => {
        if (password) {
          this.updatePasswordCriteria(password);
          this.calculatePasswordStrength(password);
        } else {
          this.resetPasswordCriteria();
        }
      });
    }

    // Validação em tempo real da confirmação
    const confirmationControl = this.form.get('password_confirmation');
    if (confirmationControl) {
      confirmationControl.valueChanges.subscribe();
    }
  }

  // Atualizar critérios da senha
  private updatePasswordCriteria(password: string): void {
    this.passwordCriteria = {
      hasLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
  }

  // Calcular força da senha
  private calculatePasswordStrength(password: string): void {
    let score = 0;

    if (this.passwordCriteria.hasLength) score += 1;
    if (this.passwordCriteria.hasUppercase) score += 1;
    if (this.passwordCriteria.hasLowercase) score += 1;
    if (this.passwordCriteria.hasNumber) score += 1;
    if (this.passwordCriteria.hasSpecial) score += 1;

    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    if (score <= 2) this.passwordStrength = 'weak';
    else if (score <= 4) this.passwordStrength = 'medium';
    else this.passwordStrength = 'strong';
  }

  // Resetar critérios da senha
  private resetPasswordCriteria(): void {
    this.passwordCriteria = {
      hasLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecial: false
    };
    this.passwordStrength = 'weak';
  }

  // Alternar visibilidade da senha
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Alternar visibilidade da confirmação de senha
  togglePasswordConfirmationVisibility(): void {
    this.showPasswordConfirmation = !this.showPasswordConfirmation;
  }

  // Obter mensagem de erro para o campo senha
  getPasswordErrorMessage(): string {
    const passwordControl = this.form.get('password');
    if (!passwordControl?.errors || !passwordControl.touched) return '';

    const errors = passwordControl.errors;

    if (errors['required']) return 'Senha é obrigatória';
    if (errors['minLength']) return `Senha deve ter pelo menos ${errors['minLength'].requiredLength} caracteres`;
    if (errors['maxLength']) return 'Senha deve ter no máximo 128 caracteres';
    if (errors['noUppercase']) return 'Senha deve conter pelo menos uma letra maiúscula';
    if (errors['noLowercase']) return 'Senha deve conter pelo menos uma letra minúscula';
    if (errors['noNumber']) return 'Senha deve conter pelo menos um número';
    if (errors['noSpecial']) return 'Senha deve conter pelo menos um caractere especial';
    if (errors['hasSpaces']) return 'Senha não pode conter espaços';
    if (errors['commonSequence']) return 'Senha não pode conter sequências comuns';

    return 'Senha inválida';
  }

  // Obter mensagem de erro para o campo confirmação
  getPasswordConfirmationErrorMessage(): string {
    const confirmationControl = this.form.get('password_confirmation');
    if (!confirmationControl?.errors || !confirmationControl.touched) return '';

    const errors = confirmationControl.errors;

    if (errors['required']) return 'Confirmação de senha é obrigatória';
    if (errors['passwordMismatch']) return 'As senhas não coincidem';

    return 'Confirmação de senha inválida';
  }

  // Verificar se o campo tem erro
  hasFieldError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }
    
    this.isLoading = { loading: true, action: 'accept' };
    this.inviteService.acceptInvite(this.data.invite.invite_token, this.form.value as AcceptInviteModel).subscribe({
      next: () => {
        this.toastService.success('Convite aceito com sucesso!');
        this.isLoading = { loading: false, action: 'accept' };
        this.onAcceptInvite.emit();
        this.resetPasswordCriteria();
        this.form.reset();
      },
      error: () => {
        this.toastService.error('Erro ao aceitar convite!');
        this.isLoading = { loading: false, action: 'accept' };
      }
    });
  }

  // Marcar todos os campos como tocados para mostrar erros
  private markFormGroupTouched(): void {
    Object.values(this.form.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
