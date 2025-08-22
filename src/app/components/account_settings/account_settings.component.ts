import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { LucideAngularModule, Building2, MapPin, Info, AlertCircle, Save, Mail, Phone, FileText, Calendar, ArrowLeft } from 'lucide-angular';

import { AccountModel } from '../../models/account.model';
import { AccountAddressModel } from '../../models/account_address.model';
import { CepService } from '../../services/cep.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ToastService } from '../../services/toast.service';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';

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
    MatCheckboxModule,
    NgxMaskDirective, 
    MatCardModule,
    LucideAngularModule
  ],
  providers: [provideNgxMask()],
  templateUrl: './account_settings.component.html',
  styleUrls: ['./account_settings.component.scss']
})
export class AccountSettingsComponent implements OnInit {
  readonly buildingIcon = Building2;
  readonly mapPinIcon = MapPin;
  readonly infoIcon = Info;
  readonly alertIcon = AlertCircle;
  readonly saveIcon = Save;
  readonly mailIcon = Mail;
  readonly phoneIcon = Phone;
  readonly fileTextIcon = FileText;
  readonly calendarIcon = Calendar;
  readonly arrowLeftIcon = ArrowLeft;

  @ViewChild('stepper') stepper!: MatStepper;
  accountForm: FormGroup = new FormGroup({});
  addressForm: FormGroup = new FormGroup({});
  isLoadingCep = false;
  hasNoHouseNumber: boolean = false;
  cpfCnpjMask: string = '000.000.000-00';
  accountId: string = '';
  addressFormInitialized: boolean = false;
  stepperOrientation: 'vertical' | 'horizontal' = 'vertical';

  account!: AccountModel
  address!: AccountAddressModel

  constructor(
    private fb: FormBuilder,
    private cepService: CepService,
    private accountService: AccountService,
    private toastService: ToastService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit(): void {
    this.onResize();

    this.initializeBasicForms();
    this.createEmptyAddressForm();
    
    this.route.params.subscribe(params => {
      this.accountId = params['id'];
      if (this.accountId) {
        this.loadAccountData();
        this.loadAccountAddress();
      } else {
        this.initializeEmptyForms();
        this.createEmptyAddressForm();
      }
    });
    
    this.checkAccount();
    this.checkAddress();
  }

  @HostListener('window:resize')
  onResize(): void {
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    this.stepperOrientation = isMobile ? 'vertical' : 'horizontal';
  }

  checkAddress(): void {
    this.accountService.$accountAddressData.subscribe(res => {
      this.address = res
    })
  }

  checkAccount(): void {
    this.accountService.$accountData.subscribe(res => {
      this.account = res
    })
  }

  createAccountForm(accountModel: AccountModel): void {
    this.accountForm = this.fb.group({
      name: [accountModel.name, [Validators.required, Validators.minLength(3)]],
      cpf_cnpj: [accountModel.cpf_cnpj, [Validators.required, Validators.minLength(11)]],
      phone_number: [accountModel.phone_number, Validators.required],
      email: [accountModel.email, [Validators.required, Validators.email]],
      birth: [accountModel.birth, Validators.required]
    });

    this.updateCpfCnpjMask(accountModel.cpf_cnpj);
  }

  createAddressForm(addressModel: AccountAddressModel): void {
    this.hasNoHouseNumber = addressModel.house_number === 'S/N';

    this.addressForm = this.fb.group({
      street: [addressModel.street || '', [Validators.required, Validators.minLength(3)]],
      house_number: [
        addressModel.house_number || '', 
        this.hasNoHouseNumber ? [] : [Validators.required]
      ],
      neighborhood: [addressModel.neighborhood || '', Validators.required],
      postal_code: [addressModel.postal_code || '', Validators.required],
      state: [addressModel.state || '', Validators.required],
      complement: [addressModel.complement || ''],
      country: [addressModel.country || '', Validators.required],
      city: [addressModel.city || '', Validators.required],
      hasNoHouseNumber: [this.hasNoHouseNumber]
    });

    if (this.hasNoHouseNumber) {
      this.addressForm.get('house_number')?.setValue('S/N');
      this.addressForm.get('house_number')?.disable();
    }
  }

  onSubmit(): void {
    if (this.accountForm.valid) {
      const formData = { ...this.account, ...this.accountForm.value };
      sessionStorage.setItem('account', JSON.stringify(formData));
      
      this.accountService.updateAccount(this.accountForm.value).subscribe({
        next: (res) => {
          this.toastService.success("Conta atualizada com sucesso!");
          this.authService.setFirstAccess(false);
          this.stepper.next();
        },
        error: (error) => {
          this.toastService.error(error.error.message || "Erro ao atualizar conta");
        }
      });
    }
  }

  onAddressSubmit(): void {
    if (this.addressForm.valid || this.hasNoHouseNumber) {
      const formValue = { ...this.addressForm.value };
      if (this.hasNoHouseNumber) {
        formValue.house_number = 'S/N';
      }

      // Criar o objeto AccountAddressModel com os dados necessários
      const addressData: AccountAddressModel = {
        id: this.address?.id || undefined,
        street: formValue.street,
        house_number: formValue.house_number,
        neighborhood: formValue.neighborhood,
        postal_code: formValue.postal_code,
        state: formValue.state,
        city: formValue.city,
        complement: formValue.complement || '',
        country: formValue.country,
        account_id: this.accountId
      };

      sessionStorage.setItem('account_address', JSON.stringify(addressData));

      this.accountService.updateAccountAddress(addressData).subscribe({
        next: (res) => {
          this.toastService.success("Endereço atualizado com sucesso!");
          this.address = res;
        },
        error: (error) => {
          this.toastService.error(error.error?.message || "Erro ao atualizar endereço");
        }
      });
    } else {
      this.toastService.error("Por favor, preencha todos os campos obrigatórios do endereço");
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
              city: endereco.localidade,
              country: 'Brasil'
            });
          },
          error: (erro) => {
            this.toastService.error(`Erro ao buscar CEP: ${erro.message}`)
          }
        });
    }
  }

  onNoHouseNumberChange(): void {
    const houseNumberControl = this.addressForm.get('house_number');
    this.hasNoHouseNumber = this.addressForm.get('hasNoHouseNumber')?.value;
    
    if (this.hasNoHouseNumber) {
      houseNumberControl?.setValue('S/N');
      houseNumberControl?.clearValidators();
      houseNumberControl?.disable();
    } else {
      houseNumberControl?.enable();
      houseNumberControl?.setValue('');
      houseNumberControl?.setValidators([Validators.required]);
    }
    houseNumberControl?.updateValueAndValidity();
  }

  onCpfCnpjInput(event: any): void {
    const value = event.target.value.replace(/\D/g, '');
    this.updateCpfCnpjMask(value);
  }

  private updateCpfCnpjMask(value: string): void {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length <= 11) {
      this.cpfCnpjMask = '000.000.000-00';
    } else {
      this.cpfCnpjMask = '00.000.000/0000-00';
    }
  }

  private loadAccountData(): void {
    const cachedAccount = sessionStorage.getItem('account');
    
    if (cachedAccount) {
      try {
        this.account = JSON.parse(cachedAccount);
        this.createAccountForm(this.account);
        return;
      } catch (e) {
        console.warn('Erro ao carregar dados da sessão:', e);
      }
    }

    this.accountService.getAccount().subscribe({
      next: (account) => {
        this.account = account;
        sessionStorage.setItem('account', JSON.stringify(account));
        this.createAccountForm(account);
      },
      error: (error) => {
        this.toastService.error(error.error?.message || "Erro ao carregar dados da conta");
        this.initializeEmptyForms();
      }
    });
  }

  private loadAccountAddress(): void {
    const cachedAddress = sessionStorage.getItem('account_address');

    if (cachedAddress) {
      try {
        this.address = JSON.parse(cachedAddress);
        this.populateAddressForm(this.address);
        return;
      } catch (e) {
        console.warn('Erro ao carregar dados do endereço da sessão, criando formulário vazio:', e);
        this.createEmptyAddressForm();
      }
    }

    this.accountService.getAccountAddress().subscribe({
      next: (address) => {
        if (address) {
          sessionStorage.setItem('account_address', JSON.stringify(address));
          this.populateAddressForm(address);
        } else {
          sessionStorage.removeItem('account_address');
          this.createEmptyAddressForm();
        }
      },
      error: (error) => {
        console.warn('Erro ao buscar endereço, criando formulário vazio:', error);
        sessionStorage.removeItem('account_address');
        this.createEmptyAddressForm();
      }
    });
  }

  private initializeEmptyForms(): void {
    this.createAccountForm(new AccountModel());
  }

  private createEmptyAddressForm(): void {
    this.createAddressForm(new AccountAddressModel());
  }

  private initializeBasicForms(): void {
    this.accountForm = this.fb.group({
      name: [''],
      cpf_cnpj: [''],
      phone_number: [''],
      birth: [''],
      email: ['']
    });
    
    this.addressForm = new FormGroup({});
  }

  private populateAddressForm(address: AccountAddressModel): void {
    this.addressForm.patchValue({
      street: address.street,
      house_number: address.house_number,
      neighborhood: address.neighborhood,
      postal_code: address.postal_code,
      state: address.state,
      complement: address.complement,
      country: address.country,
      city: address.city,
      hasNoHouseNumber: address.house_number === 'S/N'
    });
  }
}
