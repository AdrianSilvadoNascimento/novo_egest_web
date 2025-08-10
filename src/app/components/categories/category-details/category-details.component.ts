import { Component, Inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Calendar, LucideAngularModule, LucideIconData, Package, Tag } from 'lucide-angular';

import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { CategoryModel } from '../../../models/category.model';
import { ItemsService } from '../../../services/items.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, LucideAngularModule, DatePipe],
  templateUrl: './category-details.component.html',
  styleUrl: './category-details.component.scss'
})
export class CategoryDetailsComponent implements OnInit {
  readonly tagIcon: LucideIconData = Tag;
  readonly calendarIcon: LucideIconData = Calendar;
  readonly packageIcon: LucideIconData = Package;

  productsQuantity: number = 0;

  constructor(
    private itemService: ItemsService,
    private toast: ToastService,
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
      this.itemService.getAllItems().subscribe({
        next: (data) => {
          this.productsQuantity = data.filter((item: any) => item.category.id === this.category.id).length
        },
        error: () => {
          this.toast.error('Erro ao buscar produtos')
        }
      })
    }
  }
}
