import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { LucideAngularModule, FileUp, PackagePlus, PackageOpen, Search, Funnel, LayoutGrid, List } from 'lucide-angular';

import { MatIcon } from '@angular/material/icon';
import { MatCard } from "@angular/material/card";
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from "@angular/material/select";
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { PaginatedItemsModel } from '../../models/paginated-items.model';
import { ItemsService } from '../../services/items.service';
import { ProductFormComponent } from './product-form/product-form.component';
import { ItemModel } from '../../models/item.model';
import { ItemCreationModel } from '../../models/item-creation.model';
import { ToastService } from '../../services/toast.service';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { EmptyListComponent } from "../../shared/components/empty-list/empty-list.component";
import { CategoryModel } from '../../models/category.model';
import { CategoryDetailsComponent } from '../categories/category-details/category-details.component';
import { MovementationFormComponent } from '../movementation/movementation-form/movementation-form.component';
import { MovementationService } from '../../services/movementation.service';
import { DashboardService } from '../../services/dashboard.service';
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
    MatSelectModule,
    MatProgressBarModule
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

  editedProduct!: ItemModel;

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

  searchTerm: string = '';
  filteredProducts: ItemModel[] = [];
  isSearching: boolean = false;

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
        this.filteredProducts = [...this.paginatedItems.data];
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

    if (this.filteredProducts.length > 0) {
      this.sortFilteredProducts();
    }
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    
    if (!term.trim()) {
      this.filteredProducts = [...this.paginatedItems.data];
      this.isSearching = false;
      return;
    }

    this.filterProducts();
    this.performBackendSearch(term);
  }

  private performBackendSearch(term: string): void {
    this.isSearching = true;
    
    this.itemService.searchItems(term, 100).subscribe({
      next: (searchResults) => {
        const allProducts = [...this.paginatedItems.data];

        searchResults.forEach(searchItem => {
          if (!allProducts.some(existing => existing.id === searchItem.id)) {
            allProducts.push(searchItem);
          }
        });

        this.filteredProducts = allProducts.filter(product => 
          product.name.toLowerCase().includes(term.toLowerCase()) ||
          product.description?.toLowerCase().includes(term.toLowerCase()) ||
          product.barcode?.toLowerCase().includes(term.toLowerCase())
        );

        this.sortFilteredProducts();
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Erro na busca:', error);
        this.isSearching = false;
      }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredProducts = [...this.paginatedItems.data];
  }

  private filterProducts(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = [...this.paginatedItems.data];
      return;
    }
    
    const searchTerm = this.searchTerm.toLowerCase();
    this.filteredProducts = this.paginatedItems.data.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm) ||
      product.barcode?.toLowerCase().includes(searchTerm)
    );

    this.sortFilteredProducts();
  }

  private sortFilteredProducts(): void {
    this.filteredProducts = this.sortArray(
      this.filteredProducts,
      this.selectedSortBy,
      this.selectedSortOrder
    );
  }
  
  private sortCurrentData(): void {
    this.paginatedItems.data = this.sortArray(
      this.paginatedItems.data,
      this.selectedSortBy,
      this.selectedSortOrder
    );
  
    if (this.searchTerm.trim()) {
      this.filterProducts();
    } else {
      this.filteredProducts = [...this.paginatedItems.data];
    }
  }  

  private sortArray<T>(array: T[], sortBy: string, sortOrder: string): T[] {
    if (!array.length || sortBy === 'none') {
      return array;
    }
  
    return [...array].sort((a: any, b: any) => {
      let valueA: any;
      let valueB: any;
  
      switch (sortBy) {
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
      if (valueA > valueB) comparison = 1;
      else if (valueA < valueB) comparison = -1;
  
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  getTotalProducts(): void {
    this.dashboardService.getDashboardQuick().subscribe({
      next: (dashboard: DashboardModel) => {
        this.totalItems = dashboard.totalProducts;

        if (this.searchTerm.trim()) {
          this.filterProducts();
        }
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

    if (this.searchTerm.trim()) {
      this.filterProducts();
    }
  }

  loadProducts(): void {
    this.itemService.$itemData.subscribe({
      next: (itemData: PaginatedItemsModel) => {
        this.paginatedItems = itemData;
        this.isEmpty = itemData.data?.length === 0;

        if (this.searchTerm.trim()) {
          this.filterProducts();
        } else {
          this.filteredProducts = [...this.paginatedItems.data];
        }
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

        this.sortCurrentData();

        if (this.searchTerm.trim()) {
          this.filterProducts();
        } else {
          this.filteredProducts = [...this.paginatedItems.data];
        }

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
        this.clearSearch();
        this.loadProducts();
      } else {
        if (!sessionStorage.getItem('product_form_draft')) {
          sessionStorage.removeItem('product_form_draft');
        }
      }
    });
  }

  openProductDetails(product: ItemModel): void {
    this.editedProduct = product;
    
    const dialogRef = this.dialog.open(ProductDetailsComponent, {
      data: this.editedProduct,
      panelClass: 'modern-dialog',
      minWidth: '600px'
    })

    dialogRef.afterClosed().subscribe(itemDetails => {
      if (!itemDetails) return;

      this.paginatedItems.data = this.paginatedItems.data
        .map((item: ItemModel) => item.id === itemDetails.id ? itemDetails : item);

      this.sortCurrentData();

      if (this.searchTerm.trim()) {
        this.filterProducts();
      } else {
        this.filteredProducts = [...this.paginatedItems.data];
      }
    });
  }

  toggleFilters() {
    this.filterDrawer.toggle();

    if (this.searchTerm.trim()) {
      this.filterProducts();
    }
  }

  applyFilters() {
    this.clearSearch();
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

    this.clearSearch();
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

        if (this.searchTerm.trim()) {
          this.filterProducts();
        }

        const intervalId = setInterval(() => {
          this.itemService.getImportStatus(job.jobId).subscribe({
            next: (res) => {
              const status = res.status;
              if (status === 'completed') {
                clearInterval(intervalId);
                this.toast.success('Importação concluída com sucesso!');
                this.clearSearch();
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

  categoryDetails(categoryId: string): void {
    let categories = JSON.parse(sessionStorage.getItem('categoryData')!!)
    let category: CategoryModel

    if (!categories) {
      this.itemService.getCategories().subscribe({
        next: (cat: CategoryModel[]) => {
          categories = cat
          category = categories.find((cat: CategoryModel) => cat.id === categoryId)
          this.openCategoryDetails(category)

          if (this.searchTerm.trim()) {
            this.filterProducts();
          }
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
    }).afterClosed().subscribe(result => {
      if (result) {
        if (this.searchTerm.trim()) {
          this.filterProducts();
        }
      }
    });
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
            this.clearSearch();
            this.loadProducts();

            if (this.searchTerm.trim()) {
              this.filterProducts();
            }
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
      data: { item: editItem as ItemCreationModel, isEdit: true },
      minWidth: '900px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.editedProduct = result;
        this.clearSearch();
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

    this.clearSearch();
    this.loadProducts();
  }
}
