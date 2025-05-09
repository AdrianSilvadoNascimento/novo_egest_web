import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { AccountModel } from '../../models/account.model';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  templateUrl: './account_settings.component.html',
  styleUrls: ['./account_settings.component.scss']
})
export class AccountSettingsComponent implements OnInit {
  accountForm: FormGroup = new FormGroup({});

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.createForm(new AccountModel());
  }

  createForm(accountModel: AccountModel) {
    this.accountForm = this.fb.group({
      name: [accountModel.name, [Validators.required, Validators.minLength(3)]],
      cpf_cnpj: [accountModel.cpf_cnpj, [Validators.required, Validators.minLength(11)]],
      phone_number: [accountModel.phone_number, [Validators.required, Validators.pattern(/^\(\d{2}\) \d{5}-\d{4}$/)]],
      email: [accountModel.email, [Validators.required, Validators.email]],
      birth: [accountModel.birth, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.accountForm.valid) {
      console.log(this.accountForm.value);
    }
  }
} 