import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialog } from '@angular/material/dialog';
import { LucideAngularModule, PackageOpen, Calendar, Pencil, ChartColumn, X, User, Building2, ShoppingCart, ShoppingBag, CreditCard } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCard } from "@angular/material/card";
import { CustomerModel } from '../../../models/customer.model';
import { CustomerFormComponent } from '../customer-form/customer-form.component';
// import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  standalone: true,
  imports: [
    LucideAngularModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatCard,
    MatDialogContent
  ],
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.scss'
})
export class CustomerDetailsComponent implements OnInit, OnDestroy {
  readonly packageIcon = PackageOpen;
  readonly calendarIcon = Calendar;
  readonly editIcon = Pencil;
  readonly chartIcon = ChartColumn;
  readonly closeIcon = X;
  readonly businessIcon = Building2;
  readonly userIcon = User;
  readonly cartIcon = ShoppingCart;
  readonly bagIcon = ShoppingBag;
  readonly cardIcon = CreditCard;

  ticketAverage!: number;

  customerDetails!: CustomerModel;

  constructor(
    public dialogRef: MatDialogRef<CustomerDetailsComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public customer: CustomerModel
  ) {}

  ngOnInit(): void {
    this.customerDetails = this.customer;
    this.ticketAverage = this.customerDetails.summary?.total_spent && this.customerDetails.summary?.total_orders ? this.customerDetails.summary?.total_spent / this.customerDetails.summary?.total_orders : 0;
  }

  ngOnDestroy(): void {
    this.dialogRef.close(this.customerDetails);
  }

  /**
   * Configura o listener para capturar quando o dialog é fechado
   * sem usar os botões específicos (ex: clicando fora, ESC, etc.)
   */
  private setupDialogCloseListener(): void {
    let closedExplicitly = false;

    this.dialogRef.backdropClick().subscribe(() => {
      if (!closedExplicitly) {
        this.dialogRef.close(this.customerDetails);
      }
    });

    this.dialogRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape' && !closedExplicitly) {
        this.dialogRef.close(this.customerDetails);
      }
    });

    const originalClose = this.dialogRef.close.bind(this.dialogRef);
    this.dialogRef.close = (result?: any) => {
      closedExplicitly = true;
      return originalClose(result);
    };
  }

  /**
   * Abre modal para editar cliente
   * @param customer - qual o cliente será atualizado
   */
  onEditCustomer(customer: CustomerModel): void {
    const dialogRef = this.dialog.open(CustomerFormComponent, {
      minWidth: '900px',
      data: {
        customer,
        isEdit: true,
      }
    })

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        if (!sessionStorage.getItem('customer_form_draft')) {
          sessionStorage.removeItem('customer_form_draft');
        }

        return;
      }

      this.customerDetails = result;
    });
  }

  onViewReport(customer: CustomerModel): void {}
}
