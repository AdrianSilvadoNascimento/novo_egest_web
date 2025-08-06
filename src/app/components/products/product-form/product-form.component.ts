import { AfterViewInit, Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { LucideAngularModule, Package } from "lucide-angular";
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCard } from "@angular/material/card";
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ToastService } from '../../../services/toast.service';
import { ItemCreationModel } from '../../../models/item-creation.model';
import { ItemsService } from '../../../services/items.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoryModel } from '../../../models/category.model';
import { PaginatedItemsModel } from '../../../models/paginated-items.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
    imports: [
    MatCheckboxModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatCard,
    LucideAngularModule,
    CurrencyPipe
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputChange') fileInputChange!: ElementRef<HTMLInputElement>;

  form: FormGroup = new FormGroup({});
  imagePreview: string | ArrayBuffer | null = null;
  draftKey: string = 'product_form_draft';
  hasDraft: boolean = false;
  readonly packageIcon = Package;
  
  // Drag & Drop Properties
  isDragOver: boolean = false;
  errorMessage: string | null = null;
  maxFileSize: number = 5 * 1024 * 1024; // 5MB
  allowedTypes: string[] = ['image/png', 'image/jpeg', 'image/jpg'];
  
  categories: CategoryModel[] = [];
  paginatedItems!: PaginatedItemsModel

  constructor(
    private toast: ToastService,
    private itemService: ItemsService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ItemCreationModel
  ) { }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.getCategories();
    })
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.saveDraft());

    const draft = sessionStorage.getItem(this.draftKey);
    this.hasDraft = !!draft;

    if (this.data) {
      this.createForm(this.data);
      this.imagePreview = this.data.product_image;
    } else if (this.hasDraft) {
      this.loadDraft();
    } else if (!this.data && !this.hasDraft) {
      this.createForm(new ItemCreationModel());
    }
  }

  getCategories(): void {
    this.itemService.getCategories().subscribe((categories: CategoryModel[]) => {
      this.categories = categories;
    })
  }

  updatedCategories(): void {
    this.itemService.$categoryData.subscribe((categories: CategoryModel[]) => {
      this.categories = categories;
    })
  }

  createForm(productModel: ItemCreationModel): void {
    this.updatedCategories();

    this.form = this.fb.group({
      name: [productModel.name, Validators.required],
      description: [productModel.description],
      unit_price: [productModel.unit_price, [Validators.required, Validators.min(0)]],
      sale_price: [productModel.sale_price, [Validators.required, Validators.min(0)]],
      category_id: [productModel.category_id, Validators.required],
      quantity: [productModel.quantity, [Validators.required, Validators.min(0)]],
      barcode: [productModel.barcode],
      active: [productModel.active],
      product_image: [productModel.product_image],
    });
  }

  newForm(): void {
    this.clearDraft();
    this.createForm(new ItemCreationModel());
    setTimeout(() => {
      const nameField = document.querySelector('input[formControlName="name"]') as HTMLElement;
      nameField?.focus();
    });
  }

  save(): void {
    this.sendData(false);
  }

  saveAndClose(): void {
    this.sendData();
  }

  sendData(isToClose: boolean = true): void {
    if (this.form.valid) {
      if (this.data) {
        this.itemService.updateItem(this.data.id, this.form.value).subscribe(() => {
          this.toast.success('Produto atualizado com sucesso!');
          this.clearDraft();

          if (isToClose) {
            this.dialogRef.close(this.form.value);
          }

          this.form.reset();
        }, error => {
          this.toast.error(error.error.message || 'Erro ao atualizar o produto!');
        })
      } else {
        this.itemService.createItem(this.form.value).subscribe(() => {
          this.toast.success('Produto salvo com sucesso!');
          this.clearDraft();

          if (isToClose) {
            this.dialogRef.close(this.form.value);
          }

          this.form.reset();
        }, error => {
          this.toast.error(error.error.message || 'Erro ao salvar o produto!');
        })
      }
    }
  }

  close() {
    this.clearDraft();
    this.dialogRef.close();
  }

  // Drag & Drop Event Handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
    this.clearError();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  // File Input Handlers
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFileSelection(file);
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  changeImage(): void {
    this.fileInputChange.nativeElement.click();
  }

  removeImage(): void {
    this.imagePreview = null;
    this.form.patchValue({ product_image: null });
    this.clearError();
  }

  // File Processing
  private handleFileSelection(file: File): void {
    if (this.validateFile(file)) {
      this.processFile(file);
    }
  }

  private validateFile(file: File): boolean {
    this.clearError();

    // Verificar tipo de arquivo
    if (!this.allowedTypes.includes(file.type)) {
      this.setError('Formato não suportado. Use PNG ou JPG.');
      return false;
    }

    // Verificar tamanho do arquivo
    if (file.size > this.maxFileSize) {
      this.setError('Arquivo muito grande. Máximo 5MB.');
      return false;
    }

    return true;
  }

  private processFile(file: File): void {
    // Atualizar o formulário
    this.form.patchValue({ product_image: file });

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
    };
    reader.readAsDataURL(file);
  }

  private setError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.clearError(), 5000); // Limpar erro após 5 segundos
  }

  private clearError(): void {
    this.errorMessage = null;
  }

  private saveDraft(): void {
    if (!this.form.dirty) return;

    sessionStorage.setItem(this.draftKey, JSON.stringify(this.form.getRawValue()));
  }

  loadDraft(): void {
    const draft = sessionStorage.getItem(this.draftKey);
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      const draftItem = new ItemCreationModel()
      draftItem.name = parsedDraft.name;
      draftItem.description = parsedDraft.description;
      draftItem.unit_price = parsedDraft.unit_price;
      draftItem.sale_price = parsedDraft.sale_price;
      draftItem.category_id = parsedDraft.category_id;
      draftItem.quantity = parsedDraft.quantity;
      draftItem.barcode = parsedDraft.barcode;
      draftItem.active = parsedDraft.active;
      draftItem.product_image = parsedDraft.product_image;

      this.createForm(draftItem as ItemCreationModel);
    }
  }

  clearDraft(): void {
    sessionStorage.removeItem(this.draftKey);
    this.hasDraft = false;
    this.imagePreview = null;
  }

  ngOnDestroy(): void {
    if (!this.form.valid) {
      this.saveDraft();
    }
  }
}
