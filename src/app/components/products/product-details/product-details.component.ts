import { Component, Inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialog } from '@angular/material/dialog';
import { LucideAngularModule, Package, Calendar, Pencil, ChartColumn, X } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCard } from "@angular/material/card";
import { ItemModel } from '../../../models/item.model';
import { ItemCreationModel } from '../../../models/item-creation.model';
import { ProductFormComponent } from '../product-form/product-form.component';

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
  selector: 'app-product-details-dialog',
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent {
  readonly packageIcon = Package;
  readonly calendarIcon = Calendar;
  readonly editIcon = Pencil;
  readonly chartIcon = ChartColumn;
  readonly closeIcon = X;

  productDetails!: ItemModel;

  constructor(
    public dialogRef: MatDialogRef<ProductDetailsComponent>,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    @Inject(MAT_DIALOG_DATA) public product: ItemModel
  ) { }

  ngOnInit(): void {
    this.productDetails = this.product;
  }

  onEditProduct(product: ItemModel): void {
    const item = product;
    const editItem = new ItemCreationModel()
    editItem.id = item.id;
    editItem.name = item.name;
    editItem.description = item.description;
    editItem.unit_price = item.unit_price;
    editItem.sale_price = item.sale_price;
    editItem.category_id = item.category_id;
    editItem.quantity = item.quantity;
    editItem.barcode = item.barcode;
    editItem.active = item.active;
    editItem.product_image = item.product_image;

    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    const dialogRef = this.dialog.open(ProductFormComponent, {
      data: { item: editItem as ItemCreationModel, isEdit: true },
      panelClass: isMobile ? 'mobile-dialog' : 'modern-dialog',
      width: isMobile ? '95vw' : '900px',
      maxWidth: isMobile ? '95vw' : '900px',
      height: 'auto',
      maxHeight: '95vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        if (!sessionStorage.getItem('product_form_draft')) {
          sessionStorage.removeItem('product_form_draft');
        }

        return;
      }

      this.productDetails = result;
    });
  }

  onViewReport(product: ItemModel): void {}
}
