import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatCard } from "@angular/material/card";
import { MatError } from "@angular/material/form-field";
import { MatCheckbox } from "@angular/material/checkbox";
import {
  FileUp,
  Building2,
  Search,
  User,
  Mail,
  MapPin,
  Phone,
  List,
  LayoutGrid,
  Funnel,
  LucideAngularModule,
} from 'lucide-angular';

import { CustomerModel, PaginatedCustomersModel } from '../../../models/customer.model';
import { CustomerService } from '../../../services/customer.service';
import { ToastService } from '../../../services/toast.service';
import { CepService } from '../../../services/cep.service';
import { AuthService } from '../../../services/auth.service';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    MatDialogContent,
    MatCard,
    MatError,
    MatCheckbox,
    ReactiveFormsModule,
    LucideAngularModule,
    NgxMaskDirective,
    MatIcon
],
  providers: [provideNgxMask()],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss'
})
export class CustomerFormComponent implements OnInit, OnDestroy {
  readonly importIcon = FileUp;
  readonly searchIcon = Search;
  readonly filterIcon = Funnel;
  readonly cardIcon = LayoutGrid;
  readonly listIcon = List;
  readonly userIcon = User;
  readonly businessIcon = Building2;
  readonly mailIcon = Mail;
  readonly phoneIcon = Phone;
  readonly mapPinIcon = MapPin;

  form: FormGroup = new FormGroup({});
  hasDraft: boolean = false;
  draftKey: string = 'customer_form_draft';
  isLoadingCep: boolean = false;
  hasNoHouseNumber: boolean = false;
  cpfCnpjMask: string = '000.000.000-00';
  phoneMask: string = '(00) 00000-0000'; // Padrão celular

  paginatedCustomers!: PaginatedCustomersModel;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CustomerFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      customer: CustomerModel,
      isEdit: boolean,
    },
    private customerService: CustomerService,
    private toast: ToastService,
    private cepService: CepService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const draft = sessionStorage.getItem(this.draftKey);
    this.hasDraft = !!draft;

    if (this.data.customer) {
      this.createForm(this.data.customer);
    } else if (this.hasDraft) {
      this.loadDraft();
    } else {
      this.createForm(new CustomerModel());
    }

    this.form.valueChanges.subscribe(() => this.saveDraft());
  }

  ngOnDestroy(): void {
    if (!this.form.valid) this.saveDraft();
  }

  /**
   * Cria o formulário de cliente
   * @param customerModel - modelo de cliente a ser criado
   */
  createForm(customerModel: CustomerModel): void {
    // Detectar tipo automaticamente se há documento
    let detectedType = customerModel.type || 'PERSON';
    if (customerModel.document) {
      const cleanDocument = customerModel.document.replace(/\D/g, '');
      if (cleanDocument.length === 11) {
        detectedType = 'PERSON';
      } else if (cleanDocument.length === 14) {
        detectedType = 'BUSINESS';
      }
    }

    this.form = this.fb.group({
      name: [customerModel.name || '', [Validators.required, Validators.minLength(3)]],
      email: [customerModel.email || '', [Validators.email]],
      phone: [customerModel.phone || '', [this.phoneValidator.bind(this)]],
      active: [customerModel.active !== undefined ? customerModel.active : true],
      type: [detectedType],
      document: [customerModel.document || '', [this.documentValidator.bind(this)]],
      age: [customerModel.age || '', [Validators.min(0)]],
      // Campos de endereço separados
      postal_code: [customerModel.address?.postal_code || '', [Validators.pattern(/^\d{5}-?\d{3}$/)]],
      street: [customerModel.address?.street || '', [Validators.minLength(3)]],
      house_number: [customerModel.address?.house_number || ''],
      hasNoHouseNumber: [this.isHouseNumberEmpty(customerModel.address?.house_number)], // Detectar se é "sem número"
      complement: [customerModel.address?.complement || ''],
      neighborhood: [customerModel.address?.neighborhood || ''],
      city: [customerModel.address?.city || ''],
      state: [customerModel.address?.state || ''],
    });
    
    // Aplicar lógica inicial de "sem número" se necessário
    if (this.form.get('hasNoHouseNumber')?.value) {
      this.onNoHouseNumberChange();
    }
    
    // Aplicar máscara inicial do telefone se necessário
    if (customerModel.phone) {
      this.detectAndSetPhoneMask(customerModel.phone);
    }
  }

  /**
   * Busca o CEP e preenche o formulário de endereço
   */
  buscarCep(): void {
    const cep = this.form.get('postal_code')?.value;
    if (cep) {
      this.isLoadingCep = true;

      this.cepService.buscarCep(cep)
        .pipe(
          finalize(() => this.isLoadingCep = false)
        )
        .subscribe({
          next: (endereco) => {
            this.form.patchValue({
              street: endereco.logradouro,
              neighborhood: endereco.bairro,
              state: endereco.uf,
              complement: endereco.complemento,
              city: endereco.localidade,
              country: 'Brasil'
            });
          },
          error: (erro) => {
            this.toast.error(`Erro ao buscar CEP: ${erro.message}`)
          }
        });
    }
  }

  /**
   * Verifica se o número da casa foi informado
   */
  onNoHouseNumberChange(): void {
    const houseNumberControl = this.form.get('house_number');
    this.hasNoHouseNumber = this.form.get('hasNoHouseNumber')?.value;
    
    if (this.hasNoHouseNumber) {
      // Quando marca "Sem número"
      houseNumberControl?.setValue('S/N');
      houseNumberControl?.clearValidators();
      houseNumberControl?.disable();
    } else {
      // Quando desmarca "Sem número"
      houseNumberControl?.enable();
      houseNumberControl?.setValue('');
      // Número não é obrigatório, mas se preenchido deve ter pelo menos 1 caractere
      houseNumberControl?.setValidators([Validators.minLength(1)]);
    }
    houseNumberControl?.updateValueAndValidity();
  }

  /**
   * Permite apenas números e atualiza máscara do telefone dinamicamente
   * @param event - evento de input
   */
  onPhoneInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (celular com DDD)
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    // Atualizar máscara baseada no comprimento
    this.updatePhoneMask(value);
    
    // Atualizar valor do controle apenas com números
    this.form.get('phone')?.setValue(value, { emitEvent: false });
  }

  /**
   * Atualiza a máscara do telefone baseada no comprimento
   * @param value - valor do telefone sem formatação
   */
  private updatePhoneMask(value: string): void {
    if (value.length <= 10) {
      // Telefone fixo: (11) 3333-4444
      this.phoneMask = '(00) 0000-0000';
    } else {
      // Celular: (11) 99999-9999
      this.phoneMask = '(00) 00000-0000';
    }
  }

  /**
   * Formata o telefone quando o usuário sai do campo
   */
  formatPhone(): void {
    const phoneControl = this.form.get('phone');
    const value = phoneControl?.value?.replace(/\D/g, '') || '';
    
    let formattedValue = '';
    
    if (value.length === 10) {
      // Telefone fixo: (11) 3333-4444
      formattedValue = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (value.length === 11) {
      // Celular: (11) 99999-9999
      formattedValue = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else {
      // Se não tem 10 ou 11 dígitos, mantém só os números
      formattedValue = value;
    }
    
    phoneControl?.setValue(formattedValue, { emitEvent: false });
  }

  /**
   * Permite apenas números e limita a entrada durante a digitação
   * @param event - evento de input
   */
  onCpfCnpjInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    // Limita CPF a 11 dígitos e CNPJ a 14 dígitos
    if (value.length > 14) {
      value = value.substring(0, 14);
    }
    
    // Detectar tipo automaticamente durante a digitação
    if (value.length === 11) {
      // CPF = person
      this.form.get('type')?.setValue('PERSON', { emitEvent: false });
    } else if (value.length === 14) {
      // CNPJ = business
      this.form.get('type')?.setValue('BUSINESS', { emitEvent: false });
    }
    
    // Atualiza o valor do controle apenas com números
    this.form.get('document')?.setValue(value, { emitEvent: false });
  }

  /**
   * Formata o documento quando o usuário sai do campo
   */
  formatDocument(): void {
    const documentControl = this.form.get('document');
    const value = documentControl?.value?.replace(/\D/g, '') || '';
    
    let formattedValue = '';
    
    if (value.length === 11) {
      // Formato CPF: 000.000.000-00
      formattedValue = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      // Setar tipo como PERSON para CPF
      this.form.get('type')?.setValue('PERSON', { emitEvent: false });
    } else if (value.length === 14) {
      // Formato CNPJ: 00.000.000/0000-00
      formattedValue = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      // Setar tipo como BUSINESS para CNPJ
      this.form.get('type')?.setValue('BUSINESS', { emitEvent: false });
    } else {
      // Se não tem 11 nem 14 dígitos, mantém só os números
      formattedValue = value;
    }
    
    documentControl?.setValue(formattedValue, { emitEvent: false });
  }

  /**
   * Valida se o documento é um CPF ou CNPJ válido
   * @param value - valor do documento
   */
  private validateDocument(value: string): boolean {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length === 11) {
      return this.validateCPF(cleanValue);
    } else if (cleanValue.length === 14) {
      return this.validateCNPJ(cleanValue);
    }
    
    return false;
  }

  /**
   * Valida CPF
   * @param cpf - CPF sem formatação
   */
  private validateCPF(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    
    return remainder === parseInt(cpf.charAt(10));
  }

  /**
   * Valida CNPJ
   * @param cnpj - CNPJ sem formatação
   */
  private validateCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cnpj.charAt(12))) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return digit2 === parseInt(cnpj.charAt(13));
  }

  /**
   * Validador customizado para CPF/CNPJ
   * @param control - controle do formulário
   */
  documentValidator(control: any): { [key: string]: any } | null {
    const value = control.value?.replace(/\D/g, '') || '';
    
    if (!value) {
      return null; // Se vazio, deixa outros validadores (required) cuidarem
    }
    
    if (value.length !== 11 && value.length !== 14) {
      return { document: { message: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos' } };
    }
    
    const isValid = this.validateDocument(value);
    
    return isValid ? null : { document: { message: 'Documento inválido' } };
  }

  /**
   * Validador customizado para telefone
   * @param control - controle do formulário
   */
  phoneValidator(control: any): { [key: string]: any } | null {
    const value = control.value?.replace(/\D/g, '') || '';
    
    if (!value) {
      return null; // Se vazio, não é obrigatório
    }
    
    if (value.length !== 10 && value.length !== 11) {
      return { phone: { message: 'Telefone deve ter 10 (fixo) ou 11 (celular) dígitos' } };
    }
    
    // Validar se é um número de telefone brasileiro válido
    const isValid = this.validateBrazilianPhone(value);
    
    return isValid ? null : { phone: { message: 'Telefone inválido' } };
  }

  /**
   * Valida se é um telefone brasileiro válido
   * @param phone - telefone sem formatação
   */
  private validateBrazilianPhone(phone: string): boolean {
    if (phone.length === 10) {
      // Telefone fixo: deve começar com DDD válido (11-99) e número não pode começar com 0 ou 1
      const ddd = parseInt(phone.substring(0, 2));
      const firstDigit = parseInt(phone.charAt(2));
      
      return ddd >= 11 && ddd <= 99 && firstDigit >= 2 && firstDigit <= 9;
    } else if (phone.length === 11) {
      // Celular: deve começar com DDD válido (11-99) e nono dígito deve ser 9
      const ddd = parseInt(phone.substring(0, 2));
      const ninthDigit = parseInt(phone.charAt(2));
      
      return ddd >= 11 && ddd <= 99 && ninthDigit === 9;
    }
    
    return false;
  }

  /**
   * Verifica se o house_number indica "sem número"
   * @param houseNumber - número da casa
   */
  private isHouseNumberEmpty(houseNumber: any): boolean {
    if (!houseNumber) return false;
    
    const normalizedValue = houseNumber.toString().trim().toLowerCase();
    
    // Considera "sem número" se:
    // - Exatamente "s/n", "sn", "sem numero", etc.
    // - Valor 0 (do banco quando não há número)
    return normalizedValue === 's/n' || 
           normalizedValue === 'sn' || 
           normalizedValue === 'sem numero' || 
           normalizedValue === 'sem número' ||
           normalizedValue === '0';
  }

  /**
   * Detecta e define a máscara do telefone baseado no número existente
   * @param phone - telefone existente
   */
  private detectAndSetPhoneMask(phone: string): void {
    const cleanPhone = phone?.replace(/\D/g, '') || '';
    this.updatePhoneMask(cleanPhone);
  }

  /**
   * Detecta e define o tipo automaticamente baseado no documento
   * @param document - documento CPF ou CNPJ
   */
  private detectAndSetType(document: string): void {
    const cleanValue = document?.replace(/\D/g, '') || '';
    
    if (cleanValue.length === 11) {
      // CPF = person
      this.form.get('type')?.setValue('PERSON', { emitEvent: false });
    } else if (cleanValue.length === 14) {
      // CNPJ = business  
      this.form.get('type')?.setValue('BUSINESS', { emitEvent: false });
    }
  }

  /**
   * Cria um novo formulário de cliente
   */
  newForm(): void {
    this.clearDraft();
    this.createForm(new CustomerModel());
    setTimeout(() => {
      const nameField = document.querySelector('input[formControlName="name"]') as HTMLElement;
      nameField?.focus();
    });
  }

  /**
   * Salva o formulário de cliente
   * @param isClosing - se o formulário deve ser fechado após salvar
   */
  save(isClosing = false): void {
    this.sendData(isClosing);
  }

  /**
   * Envia os dados do formulário de cliente
   * @param isClosing - se o formulário deve ser fechado após enviar os dados
   */
  sendData(isClosing = true): void {
    if (this.form.valid) {
      if (!this.data.isEdit) {
        this.createCustomer(isClosing);
        return;
      }

      this.updateCustomer(isClosing);
    }
  }

  /**
   * Cria um novo cliente
   * @param isClosing - se o formulário deve ser fechado após criar o cliente
   */
  createCustomer(isClosing = true): void {
    const formData = this.form.getRawValue();
    const accountId = this.authService.getAccountId();
    
    // Monta o objeto do cliente com campos diretos (conforme DTO backend)
    const customerData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      document: formData.document,
      active: formData.active,
      type: formData.type.toLowerCase(),
      account_id: accountId,
      age: formData.age || 0,
      // Campos de endereço diretos
      postal_code: formData.postal_code,
      street: formData.street,
      house_number: formData.house_number || '0', // Se vazio ou S/N, vai como texto que o backend vai tratar
      complement: formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      country: 'Brasil'
      // hasNoHouseNumber não é enviado - apenas controle de UI
    };

    this.customerService.create(customerData as any).subscribe({
      next: (createdCustomer: CustomerModel) => {
        this.toast.success('Cliente salvo com sucesso!');
        this.clearDraft();

        if (isClosing) this.dialogRef.close(createdCustomer);
      },
      error: (error) => {
        this.toast.error('Erro ao salvar cliente: ' + error.message);
      }
    });
  }

  /**
   * Atualiza um cliente
   * @param isClosing - se o formulário deve ser fechado após atualizar o cliente
   */
  updateCustomer(isClosing = true): void {
    const formData = this.form.getRawValue();
    const accountId = this.authService.getAccountId();
    
    // Monta o objeto do cliente com campos diretos (conforme DTO backend)
    const customerData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      document: formData.document,
      active: formData.active,
      type: formData.type.toLowerCase(),
      account_id: accountId,
      age: formData.age || 0,
      // Campos de endereço diretos
      postal_code: formData.postal_code,
      street: formData.street,
      house_number: formData.house_number || '0', // Se vazio ou S/N, vai como texto que o backend vai tratar
      complement: formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      country: 'Brasil'
      // hasNoHouseNumber não é enviado - apenas controle de UI
    };

    this.customerService.update(this.data.customer.id, customerData as any).subscribe({
      next: (updatedCustomer: CustomerModel) => {
        this.toast.success('Cliente atualizado com sucesso!');
        this.clearDraft();

        if (isClosing) this.dialogRef.close(updatedCustomer);
      },
      error: (error) => {
        this.toast.error('Erro ao atualizar cliente: ' + error.message);
      }
    });
  }

  /**
   * Fecha o formulário de cliente
   */
  close(): void {
    this.clearDraft();
    this.dialogRef.close();
  }

  /**
   * Salva o formulário de cliente como rascunho
   */
  saveDraft(): void {
    if (!this.form.dirty) return;

    sessionStorage.setItem(this.draftKey, JSON.stringify(this.form.getRawValue()));
  }

  /**
   * Carrega o formulário de cliente como rascunho
   */
  loadDraft(): void {
    const draft = sessionStorage.getItem(this.draftKey);
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      const draftCustomer = new CustomerModel();
      
      // Mapear dados do rascunho
      draftCustomer.name = parsedDraft.name;
      draftCustomer.email = parsedDraft.email;
      draftCustomer.phone = parsedDraft.phone;
      draftCustomer.document = parsedDraft.document;
      draftCustomer.active = parsedDraft.active;
      draftCustomer.type = parsedDraft.type;
      
      // Mapear endereço do rascunho
      if (parsedDraft.postal_code || parsedDraft.street) {
        draftCustomer.address = {
          postal_code: parsedDraft.postal_code,
          street: parsedDraft.street,
          house_number: parsedDraft.house_number,
          complement: parsedDraft.complement,
          neighborhood: parsedDraft.neighborhood,
          city: parsedDraft.city,
          state: parsedDraft.state,
        };
      }
      
      this.createForm(draftCustomer);
    }
  }

  /**
   * Limpa o formulário de cliente como rascunho
   */
  clearDraft(): void {
    sessionStorage.removeItem(this.draftKey);
    this.hasDraft = false;
  }

  /**
   * Retorna o número da casa para exibição no resumo
   */
  getDisplayHouseNumber(): string {
    const hasNoNumber = this.form.get('hasNoHouseNumber')?.value;
    const houseNumber = this.form.get('house_number')?.value;
    
    if (hasNoNumber || houseNumber === 'S/N') {
      return 'S/N (Sem número)';
    }
    
    if (!houseNumber || houseNumber.toString().trim() === '') {
      return 'Não informado';
    }
    
    return houseNumber;
  }
}
