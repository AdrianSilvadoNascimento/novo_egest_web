import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatIcon } from '@angular/material/icon';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { LucideAngularModule, FileUp, PackagePlus, PackageOpen } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ItemsService } from '../../services/items.service';
import { Subscription } from 'rxjs';
import { PaginatedItemsModel } from '../../models/paginated-items.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { ProductFormComponent } from './product-form/product-form.component';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';

export function getPortuguesePaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = 'Itens por página';
  paginatorIntl.nextPageLabel = 'Próxima página';
  paginatorIntl.previousPageLabel = 'Página anterior';

  return paginatorIntl;
}

@Component({
  selector: 'app-products',
  standalone: true,
  providers: [{ provide: MatPaginatorIntl, useValue: getPortuguesePaginatorIntl() }],
  imports: [
    FormsModule,
    MatPaginator,
    MatIcon,
    MatTableModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    MatSidenavModule,
    LucideAngularModule,
    CurrencyPipe
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit, OnDestroy {
  readonly addIcon = PackagePlus;
  readonly packageIcon = PackageOpen;
  readonly importIcon = FileUp;

  displayedColumns: string[] = ['name', 'price', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  pageSize = 10;

  paginatedItems!: PaginatedItemsModel

  private dataSubscription!: Subscription

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatDrawer) filterDrawer!: MatDrawer;

  filters = {
    startDate: '',
    endDate: '',
    sortOrder: '',
    modifiedBy: ''
  };

  constructor(private itemService: ItemsService, private dialog: MatDialog) { }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.itemService.getPaginatedItems('', this.pageSize).subscribe((itemData: PaginatedItemsModel) => {
      this.paginatedItems = itemData;
    })

    this.loadProducts();
  }

  loadProducts(): void {
    this.dataSubscription = this.itemService.$itemData.subscribe((itemData: PaginatedItemsModel) => {
      this.paginatedItems = itemData;

      if (itemData.data) {
        this.dataSource.data = itemData.data;
        this.totalItems = itemData.data.length;
        this.dataSource.paginator = this.paginator;
      }
    }, error => {
      alert(error.error.message);
      console.error(error.error.message);
    })
  }

  onAddProduct(): void {
    const dialogRef = this.dialog.open(ProductFormComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  onImportExcel(): void {
    console.log('Importar Excel');
  }

  toggleFilters() {
    this.filterDrawer.toggle();
  }

  applyFilters() {
    console.log('Aplicando filtros:', this.filters);
    this.loadProducts();
    this.filterDrawer.close();
  }

  resetFilters() {
    this.filters = {
      startDate: '',
      endDate: '',
      sortOrder: '',
      modifiedBy: ''
    };
  }

  onEditProduct(product: any): void {
    console.log('Editar', product);
  }

  onDeleteProduct(product: any): void {
    console.log('Excluir', product);
    this.itemService.deleteItem(product.id).subscribe()

    this.loadProducts();
  }

  onPageChange(event: any): void {
    const pageSize = event.pageSize;
    const lastItem = localStorage.getItem('nextCursor') || sessionStorage.getItem('nextCursor') || '';
    this.itemService.getPaginatedItems(lastItem, pageSize).subscribe()

    this.pageSize = event.pageSize;
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.paginator.length = this.totalItems;
  }
}
