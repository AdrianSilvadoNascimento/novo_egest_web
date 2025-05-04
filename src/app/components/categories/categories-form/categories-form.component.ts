import { Component, Inject, OnInit } from '@angular/core';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryModel } from '../../../models/category.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ItemsService } from '../../../services/items.service';
import { ToastService } from '../../../services/toast.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatInputModule, MatDialogModule],
  selector: 'app-category-dialog',
  styleUrls: ['./categories-form.component.scss'],
  templateUrl: './categories-form.component.html',
})
export class CategoriesFormComponent implements OnInit {
  form: FormGroup = new FormGroup({});
  draftKey: string = 'category_form_draft';
  hasDraft: boolean = false;

  constructor(
    private fb: FormBuilder,
    private itemService: ItemsService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<CategoriesFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryModel
  ) { }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.saveDraft());

    const draft = sessionStorage.getItem(this.draftKey);
    this.hasDraft = !!draft;

    if (this.data) {
      this.createForm(this.data);
    } else if (this.hasDraft) {
      this.loadDraft();
    } else if (!this.data && !this.hasDraft) {
      this.createForm(new CategoryModel());
    }
  }

  createForm(categoryModel: CategoryModel): void {
    this.form = this.fb.group({
      name: [categoryModel.name, Validators.required],
    });
  }

  newForm(): void {
    this.clearDraft();
    this.createForm(new CategoryModel());
    setTimeout(() => {
      const nameField = document.querySelector('input[formControlName="name"]') as HTMLElement;
      nameField?.focus();
    })
  }

  save(): void {
    this.sendData();
  }

  saveAndClose(): void {
    this.sendData(true);
  }

  sendData(isToClose: boolean = false): void {
    if (this.form.valid) {
      if (this.data) {
        this.itemService.updateCategory(this.data.id, this.form.value).subscribe((category: CategoryModel) => {
          this.toast.success('Categoria atualizada com sucesso!');
          this.clearDraft();

          if (isToClose) {
            this.dialogRef.close(category);
          }

          this.form.reset();
        }, error => {
          this.toast.error(error.error.message);
          this.clearDraft();
        })
      } else {
        this.itemService.createCategory(this.form.value).subscribe((category: CategoryModel) => {
          this.toast.success('Categoria criada com sucesso!');
          this.clearDraft();

          if (isToClose) {
            this.dialogRef.close(category);
          }

          this.form.reset();
        }, error => {
          console.error('O QUE ESTÁ ACONTECENDO', error)
          this.toast.error(error.error.message);
          this.clearDraft();
        })
      }
    }
  }

  close(): void {
    this.clearDraft();
    this.dialogRef.close();
  }

  saveDraft(): void {
    if (!this.form.dirty) return

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
    this.hasDraft = false;
  }

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
