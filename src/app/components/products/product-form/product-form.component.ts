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
import { ItemModel } from '../../../models/item.model';
import { UnitOfMeasureModel } from '../../../models/unit-of-measure.model';
import { UnitOfMeasureService } from '../../../services/unit-of-measure.service';
import { CustomSelectComponent, SelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { ProductSettingsService } from '../../../services/product-settings.service';
import { ProductSettingsModel } from '../../../models/product-settings.model';

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
    CurrencyPipe,
    CustomSelectComponent
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputChange') fileInputChange!: ElementRef<HTMLInputElement>;

  form: FormGroup = new FormGroup({});
  imagePreview: string | ArrayBuffer | null = null;
  imageBase64: string | null = null;
  draftKey: string = 'product_form_draft';
  hasDraft: boolean = false;
  readonly packageIcon = Package;

  isDragOver: boolean = false;
  errorMessage: string | null = null;
  maxFileSize: number = 5 * 1024 * 1024; // 5MB
  allowedTypes: string[] = ['image/png', 'image/jpeg', 'image/jpg'];

  categories: CategoryModel[] = [];
  paginatedItems!: PaginatedItemsModel
  unitsOfMeasure: UnitOfMeasureModel[] = [];

  categoryOptions: SelectOption[] = [];
  unitOfMeasureOptions: SelectOption[] = [];

  // Configurações de produtos
  productSettings: ProductSettingsModel | null = null;
  autoGenerateBarcode: boolean = false;
  descriptionRequired: boolean = false;

  constructor(
    private toast: ToastService,
    private itemService: ItemsService,
    private unitOfMeasureService: UnitOfMeasureService,
    private productSettingsService: ProductSettingsService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: ItemCreationModel, isEdit: boolean }
  ) { }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.getCategories();
      this.loadProductSettings();
    })
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.saveDraft());

    const draft = sessionStorage.getItem(this.draftKey);
    this.hasDraft = !!draft;

    if (this.data.isEdit) {
      this.createForm(this.data.item);
      this.imagePreview = this.data.item.product_image;
    } else if (this.hasDraft) {
      this.loadDraft();
    } else if (!this.data.item && !this.hasDraft) {
      this.createForm(new ItemCreationModel());
    }
  }

  /**
   * Obtém as categorias
   */
  getCategories(): void {
    this.itemService.getCategories().subscribe((categories: CategoryModel[]) => {
      this.categories = categories;
      this.categoryOptions = categories.map(category => ({
        value: category.id,
        label: category.name,
        disabled: false
      }));
    })
  }

  /**
   * Obtém as unidades de medida
   */
  getUnitsOfMeasure(): void {
    this.unitOfMeasureService.$unitOfMeasureData.subscribe({
      next: (unitsOfMeasure: UnitOfMeasureModel[]) => {
        this.unitsOfMeasure = unitsOfMeasure;
        this.unitOfMeasureOptions = unitsOfMeasure.map(unit => ({
          value: unit.id,
          label: `${unit.name} (${unit.abbreviation})`,
          disabled: !unit.active
        }));

        if (!this.unitsOfMeasure.length) this.fetchUnitsOfMeasure();
      },
      error: (error: any) => {
        this.toast.error(error.error?.message || "Erro ao carregar unidades de medida");
      }
    })
  }

  /**
   * Faz fetch das unidades de medida
   */
  fetchUnitsOfMeasure(): void {
    this.unitOfMeasureService.getUnitsOfMeasure().subscribe({
      next: (unitsOfMeasure: UnitOfMeasureModel[]) => {
        this.unitsOfMeasure = unitsOfMeasure;
        this.unitOfMeasureOptions = unitsOfMeasure.map(unit => ({
          value: unit.id,
          label: `${unit.name} (${unit.abbreviation})`,
          disabled: !unit.active
        }));
      },
      error: (error: any) => {
        this.toast.error(error.error?.message || "Erro ao carregar unidades de medida");
      }
    })
  }

  /**
   * Carrega as configurações de produtos
   */
  loadProductSettings(): void {
    this.productSettingsService.$productSettingsData.subscribe({
      next: (settings: ProductSettingsModel | null) => {
        if (settings) {
          this.productSettings = settings;
          this.autoGenerateBarcode = settings.autoGenerateBarcode;
          this.descriptionRequired = settings.descriptionRequired;

          this.applySettingsToForm();

          this.filterActiveUnitsOfMeasure();
        } else {
          this.fetchProductSettings();
        }
      },
      error: (error: any) => {
        console.log('Erro ao carregar configurações:', error);
      }
    });
  }

  /**
   * Busca as configurações do servidor
   */
  fetchProductSettings(): void {
    this.productSettingsService.getProductSettings().subscribe({
      next: (settings: ProductSettingsModel) => {
        this.productSettings = settings;
        this.autoGenerateBarcode = settings.autoGenerateBarcode;
        this.descriptionRequired = settings.descriptionRequired;

        this.applySettingsToForm();

        this.filterActiveUnitsOfMeasure();
      },
      error: (error: any) => {
        console.log('Nenhuma configuração encontrada, usando padrões');
        this.autoGenerateBarcode = false;
        this.descriptionRequired = false;

        this.getUnitsOfMeasure();
      }
    });
  }

  /**
   * Aplica as configurações ao formulário
   */
  applySettingsToForm(): void {
    if (!this.form) return;

    const descriptionControl = this.form.get('description');
    if (descriptionControl) {
      if (this.descriptionRequired) {
        descriptionControl.setValidators([Validators.required]);
      } else {
        descriptionControl.clearValidators();
      }
      descriptionControl.updateValueAndValidity();
    }

    const barcodeControl = this.form.get('barcode');
    if (barcodeControl && this.autoGenerateBarcode) {
      if (!this.data.isEdit) {
        barcodeControl.setValue('');
        barcodeControl.disable();
      }
    }
  }

  /**
   * Filtra unidades de medida ativas conforme configuração
   */
  filterActiveUnitsOfMeasure(): void {
    if (this.productSettings && this.productSettings.unitsOfMeasure) {
      const activeUnitIds = this.productSettings.unitsOfMeasure
        .filter(unit => unit.active)
        .map(unit => unit.id);

      const filteredUnits = this.unitsOfMeasure.filter(unit =>
        activeUnitIds.includes(unit.id)
      );

      this.unitOfMeasureOptions = filteredUnits.map(unit => ({
        value: unit.id,
        label: `${unit.name} (${unit.abbreviation})`,
        disabled: false
      }));
    } else {
      this.getUnitsOfMeasure();
    }
  }

  /**
   * Atualiza as categorias
   */
  updatedCategories(): void {
    this.itemService.$categoryData.subscribe((categories: CategoryModel[]) => {
      this.categories = categories;
    })
  }

  /**
   * Cria o formulário
   * @param productModel - Modelo do produto
   */
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
      unit_of_measure_id: [productModel.unit_of_measure_id, Validators.required],
    });

    if (this.data.isEdit) {
      this.form.get('quantity')?.disable();
    }

    // Aplicar configurações ao formulário após criação
    setTimeout(() => {
      this.applySettingsToForm();
    }, 100);
  }

  /**
   * Cria um novo formulário
   */
  newForm(): void {
    this.clearDraft();
    this.createForm(new ItemCreationModel());
    setTimeout(() => {
      const nameField = document.querySelector('input[formControlName="name"]') as HTMLElement;
      nameField?.focus();
    });
  }

  /**
   * Salva o formulário
   */
  save(): void {
    this.sendData(false);
  }

  /**
   * Salva e fecha o formulário
   */
  saveAndClose(): void {
    this.sendData();
  }

  /**
   * Envia os dados
   * @param isToClose - Se deve fechar o formulário
   */
  sendData(isToClose: boolean = true): void {
    if (this.form.valid) {
      if (!this.data.isEdit) {
        this.createItem(isToClose);
        return;
      }

      this.updateItem(isToClose);
    }
  }

  /**
   * Atualiza o item
   * @param isToClose - Se deve fechar o formulário
   */
  updateItem(isToClose: boolean = true): void {
    const productData = this.form.getRawValue();

    if (!this.imageBase64) productData.product_image = '';

    this.itemService.updateItem(this.data.item.id, productData).subscribe({
      next: (updatedItem: ItemModel) => {
        this.toast.success('Produto atualizado com sucesso!');
        this.clearDraft();

        if (isToClose) this.dialogRef.close(updatedItem);

        this.form.reset();
      }, error: (error) => {
        this.toast.error(error.error.message || 'Erro ao atualizar o produto!');
      }
    })
  }

  /**
   * Cria um novo item
   * @param isToClose - Se deve fechar o formulário
   */
  createItem(isToClose: boolean = true): void {
    const productData = this.form.getRawValue();

    if (!this.imageBase64) productData.product_image = '';

    this.itemService.createItem(productData).subscribe({
      next: (createdItem: ItemModel) => {
        this.toast.success('Produto salvo com sucesso!');
        this.clearDraft();

        if (isToClose) this.dialogRef.close(createdItem);

        this.form.reset();
      }, error: (error) => {
        this.toast.error(error.error.message || 'Erro ao salvar o produto!');
      }
    })
  }

  /**
   * Fecha o formulário
   */
  close() {
    this.clearDraft();
    this.dialogRef.close();
  }

  /**
   * Evento de arrastar sobre o formulário
   * @param event - Evento de arrastar
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
    this.clearError();
  }

  /**
   * Evento de sair do formulário
   * @param event - Evento de sair
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  /**
   * Evento de soltar sobre o formulário
   * @param event - Evento de soltar
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  /**
   * Evento de seleção de imagem
   * @param event - Evento de seleção de imagem
   */
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.handleFileSelection(file);

    event.target.value = '';
  }

  /**
   * Trigger do input de arquivo
   */
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Muda a imagem
   */
  changeImage(): void {
    this.fileInputChange.nativeElement.click();
  }

  /**
   * Remove a imagem
   */
  removeImage(): void {
    this.imagePreview = null;
    this.imageBase64 = null;
    this.form.patchValue({ product_image: null });
    this.clearError();
  }

  /**
   * Handle da seleção de arquivo
   * @param file - Arquivo selecionado
   */
  private handleFileSelection(file: File): void {
    if (this.validateFile(file)) this.processFile(file);
  }

  /**
   * Valida o arquivo
   * @param file - Arquivo selecionado
   */
  private validateFile(file: File): boolean {
    this.clearError();

    if (!this.allowedTypes.includes(file.type)) {
      this.setError('Formato não suportado. Use PNG ou JPG.');
      return false;
    }

    if (file.size > this.maxFileSize) {
      this.setError('Arquivo muito grande. Máximo 5MB.');
      return false;
    }

    return true;
  }

  /**
   * Processa o arquivo
   * @param file - Arquivo selecionado
   */
  private processFile(file: File): void {
    const base64Reader = new FileReader();
    base64Reader.onload = () => {
      const base64String = base64Reader.result as string;

      const base64Data = base64String.split(',')[1];
      this.imageBase64 = base64Data;
      this.imagePreview = base64String;

      this.form.patchValue({ product_image: this.imageBase64 });
    }
    base64Reader.readAsDataURL(file);
  }

  /**
   * Define o erro
   * @param message - Mensagem de erro
   */
  private setError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.clearError(), 5000);
  }

  /**
   * Limpa o erro
   */
  private clearError(): void {
    this.errorMessage = null;
  }

  /**
   * Salva o draft
   */
  private saveDraft(): void {
    if (!this.form.dirty) return;

    sessionStorage.setItem(this.draftKey, JSON.stringify(this.form.getRawValue()));
  }

  /**
   * Carrega o draft
   */
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
      draftItem.unit_of_measure_id = parsedDraft.unit_of_measure_id;

      this.createForm(draftItem as ItemCreationModel);
    }
  }

  /**
   * Limpa o draft
   */
  clearDraft(): void {
    sessionStorage.removeItem(this.draftKey);
    this.hasDraft = false;
    this.imagePreview = null;
  }

  /**
   * Handles category selection change
   */
  onCategoryChange(option: SelectOption): void {
    this.form.patchValue({ category_id: option.value });
  }

  /**
   * Handles unit of measure selection change
   */
  onUnitOfMeasureChange(option: SelectOption): void {
    this.form.patchValue({ unit_of_measure_id: option.value });
  }

  /**
   * Destrói o componente
   */
  ngOnDestroy(): void {
    if (!this.form.valid) this.saveDraft();
  }
}
