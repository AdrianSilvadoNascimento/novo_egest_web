import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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
} from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { LoginModel } from '../../models/login.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LucideAngularModule, RouterLink, MatButtonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  readonly LockKeyholeIcon = LockKeyhole;
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;

  loginForm: FormGroup = new FormGroup({});

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.createForm(new LoginModel())
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
    });
  }

  onSubmit(): void {
    const loginObserver = {
      next: () => {
        alert('Login realizado com sucesso!');
        this.createForm(new LoginModel());
      },
      error: (err: any) => {
        alert('Erro ao realizar login!');
        console.error(err);
      }
    };

    this.authService.login(this.loginForm.value).subscribe(loginObserver);
  }
}
