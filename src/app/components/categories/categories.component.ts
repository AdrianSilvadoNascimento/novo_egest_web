import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FileUp, LucideAngularModule, PlusCircle, Tag } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

import { CategoriesFormComponent } from './categories-form/categories-form.component';
import { CategoryModel } from '../../models/category.model';
import { ItemsService } from '../../services/items.service';
import { ToastService } from '../../services/toast.service';
import { EmptyListComponent } from '../../shared/components/empty-list/empty-list.component';
import { CategoryDetailsComponent } from './category-details/category-details.component';
import { AccountModel } from '../../models/account.model';
import { AccountService } from '../../services/account.service';

@Component({
  standalone: true,
  imports: [
    MatPaginator,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    LucideAngularModule,
    EmptyListComponent,
    DatePipe,
  ],
  selector: 'app-categories',
  styleUrls: ['./categories.component.scss'],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit, AfterViewInit {
  readonly addIcon = PlusCircle;
  readonly importIcon = FileUp;
  displayedColumns = ['name', 'value', 'actions'];

  tagIcon = Tag
  categories: CategoryModel[] = [];
  paginatedCategories: CategoryModel[] = [];
  isEmpty: boolean = true;
  account: AccountModel = new AccountModel();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('categoriesTable') categoriesTable!: ElementRef;

  constructor(
    private dialog: MatDialog,
    private itemService: ItemsService,
    private toast: ToastService,
    private breakpointObserver: BreakpointObserver,
    private readonly accountService: AccountService
  ) { }

  ngAfterViewInit(): void {
    setTimeout(() => {
    })
  }

  ngOnInit(): void {
    this.getCategories();
    this.updatedCategories();
    this.getAccount();
  }

  /**
   * Obtém a conta do usuário logado
   * @param account - A conta do usuário logado
   */
  getAccount(): void {
    this.accountService.getAccount().subscribe((account: AccountModel) => {
      this.account = account;
    })
  }

  /**
   * Obtém as categorias do usuário logado
   * @param categories - As categorias a serem obtidas
   */
  getCategories(): void {
    this.itemService.getCategories().subscribe((categories: CategoryModel[]) => {
      this.categories = categories;
      this.paginatedCategories = categories
      this.isEmpty = categories?.length === 0;

      if (this.paginator) {
        this.paginator.length = categories?.length;
      }
    }, (error: any) => {
      this.toast.error(error.error.message);
    })
  }

  /**
   * Evento de mudança de página
   * @param event - O evento de mudança de página
   */
  onPageChange(event: PageEvent): void {
    const start = event.pageIndex * event.pageSize;
    const end = start + event.pageSize;
    this.paginatedCategories = this.categories.slice(start, end);
  }

  /**
   * Atualiza as categorias
   * @param categories - As categorias a serem atualizadas
   */
  updatedCategories(): void {
    if (!this.paginator) return;

    this.itemService.$categoryData.subscribe((categories: CategoryModel[]) => {
      this.categories = categories;
      this.isEmpty = categories?.length === 0;
      this.paginator.length = categories.length;
    })
  }

  /**
   * Abre o diálogo de criação de categoria
   * @param category - A categoria a ser criada
   */
  openDialog(category?: CategoryModel) {
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    const dialogRef = this.dialog.open(CategoriesFormComponent, {
      panelClass: isMobile ? 'mobile-dialog' : 'modern-dialog',
      width: isMobile ? '95vw' : '600px',
      maxWidth: isMobile ? '95vw' : '600px',
      data: category ? { ...category } : null,
    });

    dialogRef.afterClosed().subscribe((result: CategoryModel | undefined) => {
      if (!result) return;

      this.getCategories();
    });
  }

  /**
   * Abre o diálogo de detalhes de categoria
   * @param category - A categoria a ser detalhada
   */
  openCategoryDetails(category: CategoryModel): void {
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    this.dialog.open(CategoryDetailsComponent, {
      data: category,
      panelClass: isMobile ? 'mobile-dialog' : 'modern-dialog',
      width: isMobile ? '95vw' : '400px',
      maxWidth: isMobile ? '95vw' : '400px',
    })
  }

  /**
   * Importa categorias de um arquivo
   * @param event - O evento de seleção de arquivo
   */
  onFileImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedTypes.includes(file.type)) {
      this.toast.info('Por favor, selecione um arquivo .xls ou .xlsx válido.');
      return;
    }

    this.itemService.importCategories(file).subscribe({
      next: (job) => {
        this.toast.info(job.message || `Arquivo enviado. A importação de ${job.total} está em processamento...`);

        const intervalId = setInterval(() => {
          this.itemService.getImportStatus(job.jobId).subscribe({
            next: (res) => {
              const status = res.status;
              if (status === 'completed') {
                clearInterval(intervalId);
                this.toast.success('Importação concluída com sucesso!');
                this.updatedCategories();
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
      error: (err: any) => {
        this.toast.error(err.error.message || 'Erro ao enviar o arquivo.');
      }
    });

    input.value = '';
  }

  /**
   * Edita uma categoria
   * @param category - A categoria a ser editada
   */
  onEditCategory(category: CategoryModel): void {
    this.openDialog(category);
  }

  /**
   * Deleta uma categoria
   * @param category - A categoria a ser deletada
   */
  onDeleteCategory(category: CategoryModel): void {
    this.itemService.deleteCategory(category.id).subscribe(() => {
      this.toast.success('Categoria excluída com sucesso!');
      this.getCategories();
    }, (error: any) => {
      this.toast.error(error.message);
    })
  }
}
