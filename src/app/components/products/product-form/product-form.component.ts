import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [MatCheckboxModule, MatInputModule, MatDialogModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
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
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [null, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      brand: ['', Validators.required],
      active: [null],
      image: [null]
    });

    if (data) {
      this.form.patchValue(data);
    } else {
      this.loadDraft();
    }

    this.form.valueChanges.subscribe(() => this.saveDraft());
  }

  ngOnInit(): void {
    const draft = sessionStorage.getItem(this.draftKey);
    this.hasDraft = !!draft;

    // Se quiser, pode restaurar o draft também
    if (draft) {
      this.form.patchValue(JSON.parse(draft));
    }
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
      this.toast.success('Produto salvo com sucesso!');
      this.clearDraft();
    }
  }

  close() {
    this.clearDraft();
    this.dialogRef.close();
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.form.patchValue({ image: file });

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

  private loadDraft(): void {
    const draft = localStorage.getItem(this.draftKey);
    if (draft) {
      this.form.patchValue(JSON.parse(draft));
    }
  }

  private clearDraft(): void {
    sessionStorage.removeItem(this.draftKey);
  }

  ngOnDestroy(): void {
    if (!this.form.valid) {
      this.saveDraft();
    }
  }
}
