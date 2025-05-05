import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, LucideIconData, Tag } from 'lucide-angular';
import { CategoryModel } from '../../../models/category.model';
import { ItemsService } from '../../../services/items.service';

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, LucideAngularModule],
  templateUrl: './category-details.component.html',
  styleUrl: './category-details.component.scss'
})
export class CategoryDetailsComponent implements OnInit {
  readonly tagIcon: LucideIconData = Tag;

  productsQuantity: number = 0;

  constructor(
    private itemService: ItemsService,
    public dialogRef: MatDialogRef<CategoryDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public category: CategoryModel
  ) { }

  ngOnInit(): void {
    this.getProducts()
  }

  getProducts(): void {
    const products = JSON.parse(sessionStorage.getItem('allItemData')!!)

    if (products) {
      this.productsQuantity = products.filter((item: any) => item.category.id === this.category.id).length
    } else {
      this.itemService.getAllItems().subscribe((data) => {
        this.productsQuantity = data.filter((item: any) => item.category.id === this.category.id).length
      })
    }
  }
}
