import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ToastService } from '../../../services/toast.service';
import { ItemCreationModel } from '../../../models/item-creation.model';
import { ItemsService } from '../../../services/items.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    MatCheckboxModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
  form: FormGroup = new FormGroup({});
  imagePreview: string | ArrayBuffer | null = null;
  draftKey = 'product_form_draft';
  hasDraft = false;

  constructor(
    private toast: ToastService,
    private itemService: ItemsService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ItemCreationModel
  ) { }

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

  createForm(productModel: ItemCreationModel): void {
    this.form = this.fb.group({
      name: [productModel.name, Validators.required],
      description: [productModel.description],
      unit_price: [productModel.unit_price, [Validators.required, Validators.min(0)]],
      sale_price: [productModel.sale_price, [Validators.required, Validators.min(0)]],
      category: [productModel.category, Validators.required],
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
            this.dialogRef.close();
          }

          this.form.reset();
        }, error => {
          this.toast.error(error.message || 'Erro ao atualizar o produto!');
        })
      } else {
        this.itemService.createItem(this.form.value).subscribe(() => {
          this.toast.success('Produto salvo com sucesso!');
          this.clearDraft();

          if (isToClose) {
            this.dialogRef.close();
          }

          this.form.reset();
        }, error => {
          this.toast.error(error.message || 'Erro ao salvar o produto!');
        })
      }
    }
  }

  close() {
    this.clearDraft();
    this.dialogRef.close();
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.form.patchValue({ product_image: file });

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };

      reader.readAsDataURL(file);
    }
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
      draftItem.category = parsedDraft.category;
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
