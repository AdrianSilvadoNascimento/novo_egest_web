import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

import { MatIcon } from '@angular/material/icon';
import { LucideAngularModule, FileUp, PackagePlus, PackageOpen } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ItemsService } from '../../services/items.service';
import { PaginatedItemsModel } from '../../models/paginated-items.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { ProductFormComponent } from './product-form/product-form.component';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { ItemModel } from '../../models/item.model';
import { ItemCreationModel } from '../../models/item-creation.model';
import { ToastService } from '../../services/toast.service';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { MatMenuModule } from '@angular/material/menu';
import { EmptyListComponent } from "../../shared/empty-list/empty-list.component";

@Component({
  selector: 'app-products',
  standalone: true,
  providers: [],
  imports: [
    FormsModule,
    MatIcon,
    MatSidenavModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    MatSidenavModule,
    LucideAngularModule,
    InfiniteScrollDirective,
    CurrencyPipe,
    MatMenuModule,
    EmptyListComponent
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  readonly addIcon = PackagePlus;
  readonly packageIcon = PackageOpen;
  readonly importIcon = FileUp;

  pageSize = 10;
  isEmpty: boolean = true;

  paginatedItems: PaginatedItemsModel = new PaginatedItemsModel();

  hasNext: boolean = false;
  loading: boolean = false;
  nextCursor!: string;

  @ViewChild('productsTable', { static: true }) productsTable!: ElementRef;
  @ViewChild(MatDrawer) filterDrawer!: MatDrawer;

  filters = {
    startDate: '',
    endDate: '',
    sortOrder: '',
    modifiedBy: ''
  };

  constructor(private itemService: ItemsService, private dialog: MatDialog, private toast: ToastService) { }

  ngOnInit(): void {
    this.itemService.getPaginatedItems('', this.pageSize).subscribe((itemData: PaginatedItemsModel) => {
      this.paginatedItems = itemData;
      this.isEmpty = itemData.data?.length === 0;
      this.hasNext = !!itemData.nextCursor;
    })

    this.loadMore();
  }

  loadProducts(): void {
    this.itemService.$itemData.subscribe((itemData: PaginatedItemsModel) => {
      this.paginatedItems = itemData;

      this.isEmpty = itemData.data?.length === 0;
    }, error => {
      this.toast.error(error.message);
    })
  }

  loadMore(): void {
    if (this.loading || !this.hasNext) return;

    this.loading = true;
    this.toast.info('Carregando mais produtos...');

    const lastCursor = this.paginatedItems.nextCursor || '';

    this.itemService.getPaginatedItems(lastCursor, this.pageSize, true).subscribe({
      next: (itemData: PaginatedItemsModel) => {
        this.isEmpty = itemData.data?.length === 0;
        this.loading = false;
        this.hasNext = !!itemData.nextCursor;

        const newItems = itemData.data.filter(newItem =>
          !this.paginatedItems.data.some(existing => existing.id === newItem.id)
        );

        this.paginatedItems.data = [...this.paginatedItems.data, ...newItems];
        this.paginatedItems.nextCursor = itemData.nextCursor;

        sessionStorage.setItem('itemData', JSON.stringify(this.paginatedItems));
        sessionStorage.setItem('nextCursor', itemData.nextCursor || '');
      },
      error: (error) => {
        this.toast.error(error.message);
        this.loading = false;
        const cached = sessionStorage.getItem('itemData');
        if (cached) this.paginatedItems = JSON.parse(cached);
      }
    });
  }


  onAddProduct(): void {
    const dialogRef = this.dialog.open(ProductFormComponent, { width: '600px' });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      } else {
        if (!sessionStorage.getItem('product_form_draft')) {
          sessionStorage.removeItem('product_form_draft');
        }
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

  onFileImportSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.toast.info('Por favor, selecione um arquivo .xls ou .xlsx válido.');
      return;
    }

    this.itemService.importItems(file).subscribe({
      next: (job) => {
        this.toast.info(job.message || `Arquivo enviado. A importação de ${job.total} está em processamento...`);

        const intervalId = setInterval(() => {
          this.itemService.getImportStatus(job.jobId).subscribe({
            next: (res) => {
              const status = res.status;
              if (status === 'completed') {
                clearInterval(intervalId);
                this.toast.success('Importação concluída com sucesso!');
                this.loadProducts();
              } else if (status === 'failed') {
                clearInterval(intervalId);
                this.toast.error('Erro ao processar a importação.');
              }
            },
            error: () => {
              clearInterval(intervalId);
              this.toast.error('Erro ao verificar status da importação.');
            }
          });
        }, 3000);
      },
      error: (err) => {
        this.toast.error(err.error.message || 'Erro ao enviar o arquivo.');
      }
    });

    input.value = '';
  }

  openProductDetails(product: ItemModel): void {
    this.dialog.open(ProductDetailsComponent, {
      data: product,
      panelClass: 'modern-dialog'
    })
  }

  onMoveProduct(product: ItemModel): void {

  }

  onEditProduct(product: ItemModel): void {
    const item = product;
    const editItem = new ItemCreationModel()
    editItem.id = item.id;
    editItem.name = item.name;
    editItem.description = item.description;
    editItem.unit_price = item.unit_price;
    editItem.sale_price = item.sale_price;
    editItem.category = item.category;
    editItem.quantity = item.quantity;
    editItem.barcode = item.barcode;
    editItem.active = item.active;
    editItem.product_image = item.product_image;

    this.dialog.open(ProductFormComponent, {
      data: editItem as ItemCreationModel,
      width: '600px',
    });
  }

  onDeleteProduct(product: any): void {
    console.log('Excluir', product);
    this.itemService.deleteItem(product.id).subscribe()

    this.loadProducts();
  }
}
