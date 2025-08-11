import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { PasswordSetupComponent } from './password-setup.component';
import { LucideAngularModule } from "lucide-angular";

const routes: Routes = [
  { path: '', component: PasswordSetupComponent }
];

@NgModule({
  declarations: [
    PasswordSetupComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    LucideAngularModule
],
  exports: [
    PasswordSetupComponent
  ]
})
export class PasswordSetupModule { }
