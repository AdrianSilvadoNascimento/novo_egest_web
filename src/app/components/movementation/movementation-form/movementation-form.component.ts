import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Repeat,
  Settings,
  Package,
  LucideAngularModule
} from "lucide-angular";

import { ItemModel } from '../../../models/item.model';
import { MovementationModel, MovementationType } from '../../../models/movementation.model';
import { MovementationService } from '../../../services/movementation.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { MatIcon } from "@angular/material/icon";
import { MatCard } from "@angular/material/card";
import { AccountUserModel } from '../../../models/account_user.model';
import { UtilsAuthService } from '../../../services/utils/utils-auth.service';

export interface MovementationFormData {
  item: ItemModel;
}

@Component({
  selector: 'app-movementation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    LucideAngularModule,
    MatIcon,
    MatCard
  ],
  templateUrl: './movementation-form.component.html',
  styleUrl: './movementation-form.component.scss'
})
export class MovementationFormComponent implements OnInit {
  readonly packageIcon = Package;
  readonly trendingUpIcon = TrendingUp;
  readonly trendingDownIcon = TrendingDown;
  readonly shoppingCartIcon = ShoppingCart;
  readonly repeatIcon = Repeat;
  readonly settingsIcon = Settings;

  currentAccountUser: AccountUserModel = new AccountUserModel();

  movementationForm!: FormGroup;
  selectedMovementType: string = '';

  movementTypes = [
    {
      type: MovementationType.ENTRADA,
      label: 'Entrada',
      description: 'Adicionar produtos ao estoque',
      icon: this.trendingUpIcon,
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      type: MovementationType.SAIDA,
      label: 'Saída',
      description: 'Remover produtos do estoque',
      icon: this.trendingDownIcon,
      color: 'bg-gray-50 border-gray-200 text-gray-700'
    },
    {
      type: MovementationType.TRANSFERENCIA,
      label: 'Transferência',
      description: 'Mover entre locais/depósitos',
      icon: this.repeatIcon,
      color: 'bg-gray-50 border-gray-200 text-gray-700'
    },
    {
      type: MovementationType.VENDA,
      label: 'Venda',
      description: 'Registrar venda de produtos',
      icon: this.shoppingCartIcon,
      color: 'bg-gray-50 border-gray-200 text-gray-700'
    },
    {
      type: MovementationType.AJUSTE,
      label: 'Ajuste',
      description: 'Correção de inventário',
      icon: this.settingsIcon,
      color: 'bg-gray-50 border-gray-200 text-gray-700'
    }
  ];

  motivos = [
    'Compra de mercadoria',
    'Devolução de cliente',
    'Venda',
    'Quebra/Perda',
    'Transferência',
    'Correção de inventário',
    'Doação',
    'Uso interno',
    'Outro'
  ];

  constructor(
    public dialogRef: MatDialogRef<MovementationFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovementationFormData,
    private formBuilder: FormBuilder,
    private movementationService: MovementationService,
    private authService: AuthService,
    private toast: ToastService,
    private readonly utilsAuthService: UtilsAuthService,
  ) { }

  ngOnInit(): void {
    this.fetchCurrentAccountUser();
    this.createForm();
    this.selectMovementType(MovementationType.ENTRADA); // Seleciona Entrada por padrão
  }

  fetchCurrentAccountUser(): void {
    this.utilsAuthService.currentAccountUser().subscribe({
      next: (currentAccountUser) => {
        this.currentAccountUser = currentAccountUser;
      }
    });
  }

  createForm(): void {
    this.movementationForm = this.formBuilder.group({
      move_type: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit_price: [this.data.item.unit_price || 0],
      total_value: [this.data.item.unit_price || 0],
      movement_date: [new Date(), Validators.required],
      description: [''],
      supplier: [''],
      reference_document: [''],
      observations: ['']
    });

    // Calcular valor total automaticamente
    this.movementationForm.get('quantity')?.valueChanges.subscribe(() => {
      this.calculateTotalValue();
    });

    this.movementationForm.get('unit_price')?.valueChanges.subscribe(() => {
      this.calculateTotalValue();
    });
  }

  selectMovementType(type: string): void {
    this.selectedMovementType = type;
    this.movementationForm.patchValue({ move_type: type });

    // Atualizar cores dos botões
    this.movementTypes.forEach(mt => {
      if (mt.type === type) {
        mt.color = 'bg-blue-50 border-blue-200 text-blue-700';
      } else {
        mt.color = 'bg-gray-50 border-gray-200 text-gray-700';
      }
    });
  }

  calculateTotalValue(): void {
    const quantity = this.movementationForm.get('quantity')?.value || 0;
    const unitPrice = this.movementationForm.get('unit_price')?.value || 0;
    const totalValue = quantity * unitPrice;

    this.movementationForm.patchValue({ total_value: totalValue }, { emitEvent: false });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.movementationForm.valid) {
      const formValue = this.movementationForm.value;

      const movementationData: Partial<MovementationModel> = {
        move_type: formValue.move_type,
        quantity: formValue.quantity,
        description: formValue.description,
        unit_price: formValue.unit_price,
        total_value: formValue.total_value,
        item_id: this.data.item.id,
        account_id: this.authService.getAccountId() || '',
        account_user_id: this.authService.getAccountUserId() || ''
      };

      this.movementationService.moveItem(movementationData as MovementationModel).subscribe({
        next: (result) => {
          this.toast.success('Movimentação registrada com sucesso!');
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.toast.error(error.error?.message || 'Erro ao registrar movimentação');
        }
      });
    } else {
      this.toast.error('Por favor, preencha todos os campos obrigatórios');
    }
  }

  getMovementTypeIcon(type: string): any {
    const movement = this.movementTypes.find(mt => mt.type === type);
    return movement?.icon || this.packageIcon;
  }

  isFormValid(): boolean {
    return this.movementationForm.valid && this.selectedMovementType !== '';
  }

  getCurrentUserName(): string {
    return this.currentAccountUser?.name || 'Usuário Atual';
  }

  decreaseQuantity(): void {
    const currentQuantity = this.movementationForm.get('quantity')?.value || 1;
    const newQuantity = Math.max(1, currentQuantity - 1);
    this.movementationForm.patchValue({ quantity: newQuantity });
  }

  increaseQuantity(): void {
    const currentQuantity = this.movementationForm.get('quantity')?.value || 0;
    this.movementationForm.patchValue({ quantity: currentQuantity + 1 });
  }
}