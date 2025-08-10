import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';

import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { CategoriesFormComponent } from './categories-form/categories-form.component';
import { CategoryModel } from '../../models/category.model';
import { MatIconModule } from '@angular/material/icon';
import { FileUp, LucideAngularModule, PlusCircle, Tag } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { ItemsService } from '../../services/items.service';
import { MatMenuModule } from '@angular/material/menu';
import { ToastService } from '../../services/toast.service';
import { EmptyListComponent } from '../../shared/components/empty-list/empty-list.component';
import { CategoryDetailsComponent } from './category-details/category-details.component';

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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('categoriesTable') categoriesTable!: ElementRef;

  constructor(
    private dialog: MatDialog,
    private itemService: ItemsService,
    private toast: ToastService
  ) { }

  ngAfterViewInit(): void {
    setTimeout(() => {
    })
  }

  ngOnInit(): void {
    this.getCategories();
    this.updatedCategories();
  }

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

  onPageChange(event: PageEvent): void {
    const start = event.pageIndex * event.pageSize;
    const end = start + event.pageSize;
    this.paginatedCategories = this.categories.slice(start, end);
  }

  updatedCategories(): void {
    if (!this.paginator) return;

    this.itemService.$categoryData.subscribe((categories: CategoryModel[]) => {
      this.categories = categories;
      this.isEmpty = categories?.length === 0;
      this.paginator.length = categories.length;
    })
  }

  openDialog(category?: CategoryModel) {
    const dialogRef = this.dialog.open(CategoriesFormComponent, {
      minWidth: '600px',
      data: category ? { ...category } : null,
    });

    dialogRef.afterClosed().subscribe((result: CategoryModel | undefined) => {
      if (!result) return;

      this.getCategories();
    });
  }

  openCategoryDetails(category: CategoryModel): void {
    this.dialog.open(CategoryDetailsComponent, {
      data: category,
      minWidth: '400px',
      panelClass: 'modern-dialog'
    })
  }

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

  onEditCategory(category: CategoryModel): void {
    this.openDialog(category);
  }

  onDeleteCategory(category: CategoryModel): void {
    this.itemService.deleteCategory(category.id).subscribe(() => {
      this.toast.success('Categoria excluída com sucesso!');
      this.getCategories();
    }, (error: any) => {
      this.toast.error(error.message);
    })
  }
}
