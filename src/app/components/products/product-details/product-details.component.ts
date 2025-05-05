import { Component, Inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, PackageOpen } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ItemModel } from '../../../models/item.model';

@Component({
  standalone: true,
  imports: [LucideAngularModule, CurrencyPipe, MatButtonModule, MatIconModule],
  selector: 'app-product-details-dialog',
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent {
  readonly packageIcon = PackageOpen;

  constructor(
    public dialogRef: MatDialogRef<ProductDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public product: ItemModel
  ) { }
}
