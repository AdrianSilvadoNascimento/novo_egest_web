import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AccountModel } from '../../models/account.model';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { AccountAddressModel } from '../../models/account_address.model';
import { CepService } from '../../services/cep.service';
import { finalize } from 'rxjs';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { ToastService } from '../../services/toast.service';
import { AccountService } from '../../services/account.service';

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
    MatButtonModule,
    MatStepperModule,
    MatIconModule,
    NgxMaskDirective,
  ],
  providers: [provideNgxMask()],
  templateUrl: './account_settings.component.html',
  styleUrls: ['./account_settings.component.scss']
})
export class AccountSettingsComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;
  accountForm: FormGroup = new FormGroup({});
  addressForm: FormGroup = new FormGroup({});
  isLoadingCep = false;

  constructor(
    private fb: FormBuilder,
    private cepService: CepService,
    private accountService: AccountService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.createAccountForm(new AccountModel());
    this.createAddressForm(new AccountAddressModel());

    // Inscrever-se nas mudanças do formulário para debug
    this.accountForm.statusChanges.subscribe(status => {
      console.log('Account Form Status:', status);
      console.log('Account Form Valid:', this.accountForm.valid);
      console.log('Account Form Errors:', this.accountForm.errors);
    });

    this.addressForm.statusChanges.subscribe(status => {
      console.log('Address Form Status:', status);
      console.log('Address Form Valid:', this.addressForm.valid);
      console.log('Address Form Errors:', this.addressForm.errors);
    });
  }

  createAccountForm(accountModel: AccountModel) {
    this.accountForm = this.fb.group({
      name: [accountModel.name, [Validators.required, Validators.minLength(3)]],
      cpf_cnpj: [accountModel.cpf_cnpj, [Validators.required, Validators.minLength(11)]],
      phone_number: [accountModel.phone_number, Validators.required],
      email: [accountModel.email, [Validators.required, Validators.email]],
      birth: [accountModel.birth, Validators.required]
    });
  }

  createAddressForm(addressModel: AccountAddressModel) {
    this.addressForm = this.fb.group({
      street: [addressModel.street, [Validators.required, Validators.minLength(3)]],
      house_number: [addressModel.house_number, Validators.required],
      neighborhood: [addressModel.neighborhood, Validators.required],
      postal_code: [addressModel.postal_code, Validators.required],
      state: [addressModel.state, Validators.required],
      complement: [addressModel.complement],
      country: [addressModel.country, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.accountForm.valid) {
      this.accountService.updateAccount(this.accountForm.value).subscribe({
        next: (res) => {
          this.toastService.success("Conta atualizada com sucesso!");
          // Avançar para o próximo passo após salvar
          this.stepper.next();
        },
        error: (error) => {
          this.toastService.error(error.error.message || "Erro ao atualizar conta");
        }
      });
    }
  }

  onAddressSubmit(): void {
    if (this.addressForm.valid) {
      this.accountService.updateAccountAddress(this.addressForm.value).subscribe({
        next: (res) => {
          this.toastService.success("Endereço atualizado com sucesso!");
        },
        error: (error) => {
          this.toastService.error(error.error.message || "Erro ao atualizar endereço");
        }
      });
    }
  }

  buscarCep(): void {
    const cep = this.addressForm.get('postal_code')?.value;
    if (cep) {
      this.isLoadingCep = true;
      this.cepService.buscarCep(cep)
        .pipe(
          finalize(() => this.isLoadingCep = false)
        )
        .subscribe({
          next: (endereco) => {
            this.addressForm.patchValue({
              street: endereco.logradouro,
              neighborhood: endereco.bairro,
              state: endereco.uf,
              complement: endereco.complemento,
              country: 'Brasil'
            });
          },
          error: (erro) => {
            this.toastService.error(`Erro ao buscar CEP: ${erro.message}`)
          }
        });
    }
  }
} 