import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Bell, LucideAngularModule, LucideIconData, NotebookTabs, Package, Settings, Shield } from 'lucide-angular';
import { ProductsSettingsComponent } from './products-settings/products-settings.component';
import { ClientsSettingsComponent } from './clients-settings/clients-settings.component';
import { NotificationsSettingsComponent } from './notifications-settings/notifications-settings.component';
import { SecuritySettingsComponent } from './security-settings/security-settings.component';
import { SystemSettingsComponent } from './system-settings/system-settings.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  readonly settingsIcon = Settings;
  
  sections: { label: string, icon: LucideIconData, subtitle: string, active: boolean, sectionComponent: any }[] = [
    { label: 'Produtos', icon: Package, subtitle: 'Configurações para gerenciamento de produtos', active: true, sectionComponent: ProductsSettingsComponent },
    { label: 'Clientes', icon: NotebookTabs, subtitle: 'Configurações para gerenciamento de clientes', active: false, sectionComponent: ClientsSettingsComponent },
    { label: 'Notificações', icon: Bell, subtitle: 'Preferências de notificações e alertas', active: false, sectionComponent: NotificationsSettingsComponent },
    { label: 'Segurança', icon: Shield, subtitle: 'Configurações de segurança e privacidade', active: false, sectionComponent: SecuritySettingsComponent },
    { label: 'Sistema', icon: Settings, subtitle: 'Configurações gerais do sistema', active: false, sectionComponent: SystemSettingsComponent },
  ]

  constructor(private route: ActivatedRoute) { }

  /**
   * Ativa a seção correspondente ao label passado como parâmetro
   * @param sectionLabel - O label da seção a ser ativada
   * @returns 
   */
  activeSection(sectionLabel: string) {
    this.sections.forEach(section => {
      section.active = false;

      if (this.checkLabel(section.label, sectionLabel)) {
        section.active = true;
      }
    });
  }

  /** 
   * Verifica se o label contém o target
   * @param label - O label a ser verificado
   * @param target - O target a ser verificado
   * @returns true se o label contém o target, false caso contrário
   */
  private checkLabel(label: string, target: string) {
    return label.toLowerCase().includes(target.toLowerCase());
  }
}
