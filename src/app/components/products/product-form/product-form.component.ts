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
    if (this.data) {
      this.createForm(this.data);
    }

    this.form.valueChanges.subscribe(() => this.saveDraft());

    const draft = sessionStorage.getItem(this.draftKey);
    this.hasDraft = !!draft;

    if (this.hasDraft) {
      this.loadDraft();
    } else {
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

  save(): void {
    if (this.form.valid) {
      this.itemService.createItem(this.form.value).subscribe(() => {
        this.toast.success('Produto salvo com sucesso!');
        this.clearDraft();
        this.form.reset();
      }, error => {
        this.toast.error('Erro ao salvar o produto!');
        console.error(error.error.message);
      })
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
    sessionStorage.setItem(this.draftKey, JSON.stringify(this.form.getRawValue()));
  }

  loadDraft(): void {
    const draft = sessionStorage.getItem(this.draftKey);
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      this.form.patchValue(parsedDraft);
    }
  }

  clearDraft(): void {
    sessionStorage.removeItem(this.draftKey);
  }

  ngOnDestroy(): void {
    if (!this.form.valid) {
      this.saveDraft();
    }
  }
}
