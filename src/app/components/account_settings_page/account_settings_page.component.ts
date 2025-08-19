import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { AccountUserSettingsComponent } from '../account_user_settings/account_user_settings.component';
import { AccountSettingsComponent } from '../account_settings/account_settings.component';
import { LucideAngularModule, Settings, User, Building2, MapPin } from 'lucide-angular';

@Component({
  selector: 'app-account-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    AccountUserSettingsComponent,
    AccountSettingsComponent,
    LucideAngularModule
  ],
  templateUrl: './account_settings_page.component.html',
  styleUrls: ['./account_settings_page.component.scss']
})
export class AccountSettingsPageComponent implements OnInit {
  readonly settingsIcon = Settings;
  readonly userIcon = User;
  readonly buildingIcon = Building2;
  readonly mapPinIcon = MapPin;

  accountId: string = '';
  activeSection: 'personal' | 'company' | 'address' = 'personal';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const accountId = params['id'] || '';
      
      this.accountId = accountId;

      if (!accountId) {
        this.activeSection = 'company';
      }
    });
  }
}
