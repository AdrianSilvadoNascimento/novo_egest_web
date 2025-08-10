import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

import {
  LucideAngularModule,
  UserPlus,
  User,
  Mail,
  Lock,
  Package,
  Chrome,
  Building2,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatCard } from "@angular/material/card";
import { MatIcon } from "@angular/material/icon";

import { RegisterModel } from '../../models/register.model';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { MatCheckbox } from "@angular/material/checkbox";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [LucideAngularModule, RouterLink, MatButtonModule, ReactiveFormsModule, MatCard, MatIcon, MatCheckbox],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  readonly UserPlusIcon = UserPlus;
  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly packageIcon = Package;
  readonly googleIcon = Chrome;
  readonly businessIcon = Building2;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly CheckIcon = Check;
  readonly XIcon = X;

  registerForm: FormGroup = new FormGroup({});
  
  // Propriedades para validação de senha
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

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.createForm(new RegisterModel());
    this.setupPasswordValidation();
  }

  createForm(model: RegisterModel): void {
    this.registerForm = this.formBuilder.group({
      name: [model.name, Validators.required],
      email: [
        model.email,
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/),
        ]
      ],
      password: [
        model.password, 
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
          this.passwordValidator()
        ]
      ],
      password_confirmation: [
        model.password_confirmation, 
        [
          Validators.required,
          this.passwordConfirmationValidator()
        ]
      ],
      business_name: [model.business_name],
      terms: [model.terms, Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  // Validador customizado para senha
  private passwordValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const password = control.value;
      const errors: ValidationErrors = {};
      
      // Verificar comprimento
      if (password.length < 8) {
        errors['minLength'] = { requiredLength: 8, actualLength: password.length };
      }
      
      // Verificar letra maiúscula
      if (!/[A-Z]/.test(password)) {
        errors['noUppercase'] = true;
      }
      
      // Verificar letra minúscula
      if (!/[a-z]/.test(password)) {
        errors['noLowercase'] = true;
      }
      
      // Verificar número
      if (!/\d/.test(password)) {
        errors['noNumber'] = true;
      }
      
      // Verificar caractere especial
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors['noSpecial'] = true;
      }
      
      // Verificar se contém espaços
      if (/\s/.test(password)) {
        errors['hasSpaces'] = true;
      }
      
      // Verificar sequências comuns
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
      
      const password = this.registerForm?.get('password')?.value;
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
    const passwordControl = this.registerForm.get('password');
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
    const confirmationControl = this.registerForm.get('password_confirmation');
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
    const passwordControl = this.registerForm.get('password');
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
    const confirmationControl = this.registerForm.get('password_confirmation');
    if (!confirmationControl?.errors || !confirmationControl.touched) return '';
    
    const errors = confirmationControl.errors;
    
    if (errors['required']) return 'Confirmação de senha é obrigatória';
    if (errors['passwordMismatch']) return 'As senhas não coincidem';
    
    return 'Confirmação de senha inválida';
  }

  // Verificar se o campo tem erro
  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const registerObserver = {
      next: () => {
        this.toast.success('Cadastro realizado com sucesso!');
        this.registerForm.reset();
        this.resetPasswordCriteria();
      },
      error: (error: any) => {
        this.toast.error(error.error.message || 'Erro ao realizar o cadastro!');
      },
    };

    this.authService.register(this.registerForm.value).subscribe(registerObserver);
  }

  // Marcar todos os campos como tocados para mostrar erros
  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }
}
