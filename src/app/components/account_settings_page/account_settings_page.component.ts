import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { AccountUserSettingsComponent } from '../account_user_settings/account_user_settings.component';
import { AccountSettingsComponent } from '../account_settings/account_settings.component';

@Component({
  selector: 'app-account-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    AccountUserSettingsComponent,
    AccountSettingsComponent
  ],
  templateUrl: './account_settings_page.component.html',
  styleUrls: ['./account_settings_page.component.scss']
})
export class AccountSettingsPageComponent implements OnInit {
  accountId: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.accountId = params['id'] || '';
    });
  }
}
