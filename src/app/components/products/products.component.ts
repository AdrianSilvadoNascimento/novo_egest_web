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
import { DashboardModel } from '../../models/dashboard.model';

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

  selectedSortBy: string = 'name';
  selectedSortOrder: string = 'desc';

  constructor(
    private dialog: MatDialog,
    private itemService: ItemsService,
    private moveService: MovementationService,
    private dashboardService: DashboardService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
    this.getTotalProducts();
  }

  loadInitialData(): void {
    this.itemService.getPaginatedItems('', this.pageSize).subscribe({
      next: (itemData: PaginatedItemsModel) => {
        this.paginatedItems = itemData;
        this.isEmpty = itemData.data?.length === 0;
        this.hasNext = !!itemData.nextCursor;
        this.sortCurrentData();
      },
      error: (error) => {
        this.toast.error(error.message);
      }
    });
  }

  onSortChange(sortBy: string): void {
    this.selectedSortBy = sortBy;
    this.selectedSortOrder = 'asc';

    this.sortCurrentData();
  }

  private sortCurrentData(): void {
    if (!this.paginatedItems.data || this.selectedSortBy === 'none') {
      return;
    }

    this.paginatedItems.data.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.selectedSortBy) {
        case 'name':
          valueA = a.name?.toLowerCase() || '';
          valueB = b.name?.toLowerCase() || '';
          break;
        case 'sale_price':
          valueA = parseFloat(a.sale_price?.toString() || '0');
          valueB = parseFloat(b.sale_price?.toString() || '0');
          break;
        case 'unit_price':
          valueA = parseFloat(a.unit_price?.toString() || '0');
          valueB = parseFloat(b.unit_price?.toString() || '0');
          break;
        case 'category':
          valueA = a.category?.name?.toLowerCase() || '';
          valueB = b.category?.name?.toLowerCase() || '';
          break;
        case 'active':
          valueA = a.active ? 1 : 0;
          valueB = b.active ? 1 : 0;
          break;
        default:
          return 0;
      }

      let comparison = 0;
      if (valueA > valueB) {
        comparison = 1;
      } else if (valueA < valueB) {
        comparison = -1;
      }

      return this.selectedSortOrder === 'asc' ? comparison : -comparison;
    });
  }

  getTotalProducts(): void {
    this.dashboardService.getDashboardQuick().subscribe({
      next: (dashboard: DashboardModel) => {
        this.totalItems = dashboard.totalProducts;
      },
      error: (error) => {
        this.toast.error(error.message);
      }
    })
  }

  toggleViewMode(mode: 'card' | 'list'): void {
    this.viewMode.card = false;
    this.viewMode.list = false;

    this.viewMode[mode] = true;
  }

  loadProducts(): void {
    this.itemService.$itemData.subscribe({
      next: (itemData: PaginatedItemsModel) => {
      this.paginatedItems = itemData;

      this.isEmpty = itemData.data?.length === 0;
      },
      error: (error) => {
        this.toast.error(error.message);
      }
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

        this.paginatedItems.data = [...this.paginatedItems.data, ...itemData.data];
        this.paginatedItems.nextCursor = itemData.nextCursor;

        // Aplicar ordenação aos novos dados carregados
        this.sortCurrentData();

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
