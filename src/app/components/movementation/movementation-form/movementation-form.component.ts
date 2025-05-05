import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule } from 'lucide-angular';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MovementationModel } from '../../../models/movementation.model';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-movementation-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    LucideAngularModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSelectModule
  ],
  templateUrl: './movementation-form.component.html',
  styleUrl: './movementation-form.component.scss'
})
export class MovementationFormComponent implements OnInit {
  form: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MovementationFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovementationModel
  ) { }

  ngOnInit(): void {
    if (this.data) {
      this.createForm(this.data);
    } else {
      this.createForm(new MovementationModel());
    }
  }

  createForm(model: MovementationModel): void {
    this.form = this.fb.group({
      quantity: [model.quantity, [Validators.required, Validators.min(1)]],
      move_type: [model.move_type, Validators.required],
    });
  }

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
