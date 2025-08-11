import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  LucideAngularModule,
  LockKeyhole,
  Mail,
  Lock,
  Chrome,
  Package
} from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatCard } from "@angular/material/card";
import { MatIcon } from "@angular/material/icon";

import { LoginModel } from '../../models/login.model';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { GoogleAuthService, GoogleUserData } from '../../services/google-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LucideAngularModule, RouterLink, MatButtonModule, ReactiveFormsModule, MatCard, MatIcon],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  readonly LockKeyholeIcon = LockKeyhole;
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly googleIcon = Chrome;
  readonly packageIcon = Package;

  private emailRegistered!: string

  loginForm: FormGroup = new FormGroup({});

  constructor(
    private toast: ToastService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private googleAuthService: GoogleAuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.$registeredEmail.subscribe((email) => {
      this.emailRegistered = email || ''
    })

    if (this.emailRegistered) {
      const model = new LoginModel()
      model.email = this.emailRegistered
      this.createForm(model)
    } else {
      this.createForm(new LoginModel())
    }
  }

  createForm(model: LoginModel): void {
    this.loginForm = this.formBuilder.group({
      email: [
        model.email,
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/),
        ],
      ],
      password: [model.password, Validators.required],
      remember: [model.remember],
    });
  }

  onSubmit(): void {
    const loginObserver = {
      next: () => {
        this.toast.success('Login realizado com sucesso!');
        this.loginForm.reset();
      },
      error: (err: any) => {
        this.toast.error(err.error.message || 'Erro ao realizar login!');
      }
    };

    this.authService.login(this.loginForm.value).subscribe(loginObserver);
  }

  async signInWithGoogle(): Promise<void> {
    try {
      this.googleAuthService.signInWithGoogle().subscribe({
        next: (googleUser: GoogleUserData) => {
          if (googleUser.isNewUser) {
            this.router.navigate(['/auth/password-setup']);
          } else {
            this.authService.loginWithGoogle(googleUser).subscribe()
          }
        },
        error: (error) => {
          console.error('Erro no login Google:', error);
          this.toast.error('Erro ao fazer login com Google. Tente novamente.');
        }
      })
    } catch (error) {
      console.error('Erro ao iniciar login Google:', error);
      this.toast.error('Erro ao iniciar login com Google. Tente novamente.');
    }
  }
}
