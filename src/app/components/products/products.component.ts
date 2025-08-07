import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

import { MatIcon } from '@angular/material/icon';
import { LucideAngularModule, FileUp, PackagePlus, PackageOpen, Search, Funnel, LayoutGrid, List } from 'lucide-angular';
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
import { EmptyListComponent } from "../../shared/components/empty-list/empty-list.component";
import { CategoryModel } from '../../models/category.model';
import { CategoryDetailsComponent } from '../categories/category-details/category-details.component';
import { MovementationFormComponent } from '../movementation/movementation-form/movementation-form.component';
import { MovementationService } from '../../services/movementation.service';
import { MatCard } from "@angular/material/card";
import { DashboardService } from '../../services/dashboard.service';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from "@angular/material/select";
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-products',
  standalone: true,
  providers: [],
  imports: [
    FormsModule,
    MatIcon,
    MatSidenavModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatSidenavModule,
    LucideAngularModule,
    InfiniteScrollDirective,
    CurrencyPipe,
    MatMenuModule,
    EmptyListComponent,
    MatCard,
    MatSelectModule
],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  readonly addIcon = PackagePlus;
  readonly packageIcon = PackageOpen;
  readonly importIcon = FileUp;
  readonly searchIcon = Search;
  readonly filterIcon = Funnel;
  readonly cardIcon = LayoutGrid;
  readonly listIcon = List;

  viewMode: { card: boolean, list: boolean } = { card: true, list: false };
  sortBy: { html: string, value: string }[] = [
    { html: 'Nome', value: 'name' },
    { html: 'Preço de Venda', value: 'sale_price' },
    { html: 'Preço Unitário', value: 'unit_price' },
    { html: 'Categoria', value: 'category' },
    { html: 'Status', value: 'active' }
  ]
  
  pageSize = 10;
  isEmpty: boolean = true;

  paginatedItems: PaginatedItemsModel = new PaginatedItemsModel();
  totalItems: number = 0;

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

  constructor(
    private dialog: MatDialog,
    private itemService: ItemsService,
    private moveService: MovementationService,
    private authService: AuthService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.itemService.getPaginatedItems('', this.pageSize).subscribe((itemData: PaginatedItemsModel) => {
      this.paginatedItems = itemData;
      this.isEmpty = itemData.data?.length === 0;
      this.hasNext = !!itemData.nextCursor;
    })

    const allItemData = this.authService.rememberMe()
      ? localStorage.getItem('allItemData')
      : sessionStorage.getItem('allItemData')
    this.totalItems = allItemData ? JSON.parse(allItemData).length : 0

    this.loadMore();
  }

  getAllItems(): void {
    this.itemService.getAllItems().subscribe()
  }

  toggleViewMode(mode: 'card' | 'list'): void {
    this.viewMode.card = false;
    this.viewMode.list = false;

    this.viewMode[mode] = true;
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
    const dialogRef = this.dialog.open(ProductFormComponent, { minWidth: '900px' });

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

  toggleFilters() {
    this.filterDrawer.toggle();
  }

  applyFilters() {
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
      panelClass: 'modern-dialog',
      minWidth: '600px'
    })
  }

  categoryDetails(categoryId: string): void {
    let categories = JSON.parse(sessionStorage.getItem('categoryData')!!)
    let category: CategoryModel

    if (!categories) {
      this.itemService.getCategories().subscribe({
        next: (cat: CategoryModel[]) => {
          categories = cat
          category = categories.find((cat: CategoryModel) => cat.id === categoryId)
          this.openCategoryDetails(category)
        }, error: (error) => {
          this.toast.error(error.message || error.error.message || 'Erro ao carregar categorias!')
        }
      })
    }

    category = categories.find((cat: CategoryModel) => cat.id === categoryId)
    this.openCategoryDetails(category)
  }

  openCategoryDetails(category: CategoryModel): void {
    this.dialog.open(CategoryDetailsComponent, {
      data: category
    })
  }

  onMoveProduct(item: ItemModel): void {
    this.dialog.open(MovementationFormComponent, {
      data: {
        mode: 'entry',
        item,
      },
      width: '600px'
    }).afterClosed().subscribe(result => {
      if (result) {
        this.moveService.moveItem({ ...result, item_id: item.id }).subscribe({
          next: (data) => {
            this.toast.success('Produto movido com sucesso!')
            this.loadProducts();
          }, error: (error) => {
            this.toast.error(error.message || error.error.message || 'Erro ao mover o produto!')
          }
        })
      }
    });
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

    const dialogRef = this.dialog.open(ProductFormComponent, {
      data: editItem as ItemCreationModel,
      minWidth: '900px'
    });

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

  onDeleteProduct(product: any): void {
    this.itemService.deleteItem(product.id).subscribe()

    this.loadProducts();
  }
}
