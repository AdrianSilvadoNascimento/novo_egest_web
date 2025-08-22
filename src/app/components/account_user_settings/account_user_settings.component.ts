import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { AccountUserModel } from '../../models/account_user.model';
import { AccountUserService } from '../../services/account-user.service';
import { ToastService } from '../../services/toast.service';
import { LucideAngularModule, User, Mail, AlertCircle, Save } from 'lucide-angular';

@Component({
  selector: 'app-account-user-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    LucideAngularModule,
  ],
  templateUrl: './account_user_settings.component.html',
  styleUrls: ['./account_user_settings.component.scss']
})
export class AccountUserSettingsComponent implements OnInit {
  readonly userIcon = User;
  readonly mailIcon = Mail;
  readonly alertIcon = AlertCircle;
  readonly saveIcon = Save;

  @Input() accountId: string = '';
  
  accountUserForm: FormGroup = new FormGroup({});
  accountUser!: AccountUserModel;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private accountUserService: AccountUserService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    // Tentar carregar dados da sessão primeiro
    const cachedAccountUser = sessionStorage.getItem('account_user_data');
    
    if (cachedAccountUser) {
      try {
        this.accountUser = JSON.parse(cachedAccountUser);
        this.createAccountUserForm(this.accountUser);
        return;
      } catch (e) {
        console.warn('Erro ao carregar dados do usuário da sessão:', e);
      }
    }

    this.createAccountUserForm(new AccountUserModel());
    
    if (this.accountId) {
      this.loadAccountUserData();
    }
  }

  createAccountUserForm(accountUserModel: AccountUserModel): void {
    this.accountUserForm = this.fb.group({
      user_name: [accountUserModel.name, [Validators.required, Validators.minLength(2)]],
      user_lastname: [accountUserModel.lastname, [Validators.required, Validators.minLength(2)]],
      user_email: [accountUserModel.email, [Validators.required, Validators.email]]
    });
  }

  loadAccountUserData(): void {
    this.isLoading = true;
    this.accountUserService.getAccountUser().subscribe({
      next: (accountUser) => {
        this.accountUser = accountUser;
        sessionStorage.setItem('account_user_data', JSON.stringify(accountUser));
        this.createAccountUserForm(accountUser);
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error(error.error?.message || "Erro ao carregar dados do usuário");
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.accountUserForm.valid) {
      this.isLoading = true;
      const formData: AccountUserModel = {
        ...this.accountUser,
        name: this.accountUserForm.value.user_name,
        lastname: this.accountUserForm.value.user_lastname,
        email: this.accountUserForm.value.user_email
      };
      
      // Salvar dados na sessão antes de enviar
      sessionStorage.setItem('account_user_data', JSON.stringify(formData));
      
      this.accountUserService.updateAccountUser(formData).subscribe({
        next: (res) => {
          this.toastService.success("Dados pessoais atualizados com sucesso!");
          this.isLoading = false;
        },
        error: (error) => {
          this.toastService.error(error.error?.message || "Erro ao atualizar dados pessoais");
          this.isLoading = false;
        }
      });
    }
  }
}
