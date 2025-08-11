import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Package } from 'lucide-angular';

import { GoogleAuthService, GoogleUserData } from '../../services/google-auth.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-password-setup',
  templateUrl: './password-setup.component.html',
  styleUrls: ['./password-setup.component.scss']
})
export class PasswordSetupComponent implements OnInit {
  readonly packageIcon = Package;

  passwordForm: FormGroup;
  loading = false;
  googleUserData: GoogleUserData | null = null;
  passwordCriteria = {
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private googleAuthService: GoogleAuthService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Verificar se há dados do usuário Google
    this.googleAuthService.getCurrentUser().subscribe(user => {
      if (!user) {
        this.router.navigate(['/register']);
        return;
      }

      // Obter dados do usuário Google
      this.googleUserData = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
        isNewUser: true
      };
    });
  }

  /**
   * Validador para confirmar se as senhas coincidem
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  /**
   * Verifica os critérios da senha
   */
  checkPasswordCriteria(event: Event): void {
    const password = (event.target as HTMLInputElement).value;
    this.passwordCriteria = {
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  }

  /**
   * Submete o formulário
   */
  onSubmit(): void {
    if (this.passwordForm.valid && this.googleUserData) {
      this.loading = true;
      
      // Aqui você implementará a lógica para criar a conta no seu backend
      // Por enquanto, vamos simular o processo
      this.createPasswordAccount();
    }
  }

  /**
   * Cria a conta com senha no backend
   */
  private createPasswordAccount(): void {
    const { password } = this.passwordForm.value;
    
    if (!this.googleUserData) {
      this.toastService.error('Dados do usuário Google não encontrados');
      this.loading = false;
      return;
    }

    this.authService.updateAccountUserPassword(password).subscribe({
      next: () => {
        this.toastService.success('Senha definida com sucesso!');
        // Redirecionar para home após definir senha
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Erro ao atualizar senha:', error);
        this.toastService.error('Erro ao atualizar senha. Tente novamente.');
      }
    });
  }
}
