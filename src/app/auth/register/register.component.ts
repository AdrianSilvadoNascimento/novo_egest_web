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
  UserPlus,
  User,
  Mail,
  Lock
} from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { RegisterModel } from '../../models/register.model';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [LucideAngularModule, RouterLink, MatButtonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  readonly UserPlusIcon = UserPlus;
  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;

  registerForm: FormGroup = new FormGroup({});

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.createForm(new RegisterModel())
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
      password: [model.password, Validators.required],
    })
  }

  onSubmit() {
    const registerObserver = {
      next: () => {
        this.toast.success('Cadastro realizado com sucesso!');
        this.registerForm.reset();
      },
      error: (error: any) => {
        this.toast.error(error.error.message || 'Erro ao realizar o cadastro!');
      },
    };

    this.authService.register(this.registerForm.value).subscribe(registerObserver);
  }
}
