import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatExpansionModule } from '@angular/material/expansion';

import { ValidateUserService } from '../../../services/utils';
import { AccountUserModel } from '../../../models/account_user.model';
import { ToastService } from '../../../services/toast.service';
import { AccountUserService } from '../../../services/account-user.service';
import { CustomToggleComponent } from '../../../shared/components/custom-toggle/custom-toggle.component';
import { UnitOfMeasureType, UnitOfMeasureAbbreviation } from '../../../enums/unit-of-measure.enum';
import { UnitOfMeasureService } from '../../../services/unit-of-measure.service';
import { UnitOfMeasureModel } from '../../../models/unit-of-measure.model';
import { ProductSettingsService } from '../../../services/product-settings.service';
import { ProductSettingsModel, ProductSettingsCreationModel } from '../../../models/product-settings.model';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

// Interface para tipagem
interface UnitOfMeasure {
  id: number;
  name: UnitOfMeasureType;
  abbreviation: UnitOfMeasureAbbreviation;
  active: boolean;
  lowStockThreshold: number;
}

@Component({
  selector: 'app-products-settings',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, CustomToggleComponent, MatProgressSpinner],
  templateUrl: './products-settings.component.html',
  styleUrl: './products-settings.component.scss'
})
export class ProductsSettingsComponent implements OnInit {
  currentAccountUser: AccountUserModel = new AccountUserModel();
  unitsOfMeasure: UnitOfMeasureModel[] = [];

  autoGenerateBarcode: boolean = false;
  descriptionRequired: boolean = false;
  isSavingSettings: boolean = false;

  constructor(
    private readonly toastService: ToastService,
    private readonly accountUserService: AccountUserService,
    private readonly unitOfMeasureService: UnitOfMeasureService,
    private readonly productSettingsService: ProductSettingsService,
    readonly validateUserService: ValidateUserService,
  ) { }

  ngOnInit(): void {
    this.getCurrentAccountUser();
    this.getUnitsOfMeasure();
    this.loadProductSettings();
  }

  /**
   * Obtém os dados do usuário atual
   */
  getCurrentAccountUser(): void {
    this.accountUserService.$accountUserData.subscribe({
      next: (accountUser: AccountUserModel) => {
        if (!accountUser.id) {
          this.fetchCurrentAccountUser();
          return;
        }

        this.currentAccountUser = accountUser;
      },
      error: (error: any) => {
        this.toastService.error(error.error?.message || "Erro ao carregar dados do usuário");
      }
    });
  }

  /**
   * Fallback para buscar os dados do usuário atual
   */
  fetchCurrentAccountUser(): void {
    this.accountUserService.getAccountUser().subscribe({
      next: (accountUser: AccountUserModel) => {
        this.currentAccountUser = accountUser;
      },
      error: (error: any) => {
        this.toastService.error(error.error?.message || "Erro ao carregar dados do usuário");
      }
    });
  }

  /**
   * Obtém as unidades de medida
   */
  getUnitsOfMeasure(): void {
    this.unitOfMeasureService.getUnitsOfMeasure().subscribe({
      next: (unitsOfMeasure: UnitOfMeasureModel[]) => {
        this.unitsOfMeasure = unitsOfMeasure;
      }
    });
  }

  /**
   * Carrega as configurações de produtos
   */
  loadProductSettings(): void {
    this.productSettingsService.getProductSettings().subscribe({
      next: (settings: ProductSettingsModel) => {
        this.autoGenerateBarcode = settings.autoGenerateBarcode;
        this.descriptionRequired = settings.descriptionRequired;

        if (settings.unitsOfMeasure && settings.unitsOfMeasure.length > 0) {
          this.updateUnitsFromSettings(settings.unitsOfMeasure);
        }
      },
      error: (error: any) => {
        console.log('Nenhuma configuração encontrada ou erro:', error);
        if (error.status !== 404) {
          this.toastService.error(error.error?.message || "Erro ao carregar configurações");
        }
      }
    });
  }

  /**
   * Atualiza as unidades de medida com as configurações salvas
   * @param savedUnits - Unidades de medida salvas
   */
  private updateUnitsFromSettings(savedUnits: any[]): void {
    this.unitsOfMeasure.forEach(unit => {
      const savedUnit = savedUnits.find(saved => saved.id === unit.id);
      if (savedUnit) {
        unit.active = savedUnit.active;
        unit.low_stock_threshold = savedUnit.lowStockThreshold;
      }
    });
  }

  /**
   * Alterna o estado da unidade de medida
   * @param unit - Unidade de medida
   */
  toggleUnit(unit: UnitOfMeasureModel) {
    unit.active = !unit.active;
    if (!unit.active) {
      unit.low_stock_threshold = 0;
    }
  }

  /**
   * Atualiza o estoque mínimo da unidade de medida
   * @param unit - Unidade de medida
   * @param value - Valor do estoque mínimo
   */
  updateThreshold(unit: UnitOfMeasureModel, value: number) {
    unit.low_stock_threshold = Math.max(0, value);
  }

  /**
   * Atualiza o estoque mínimo da unidade de medida
   * @param unit - Unidade de medida
   * @param event - Evento
   */
  onThresholdChange(unit: UnitOfMeasureModel, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target ? +target.value : 0;
    this.updateThreshold(unit, value);
  }

  /**
   * Alterna a geração automática de código de barras
   */
  toggleBarcodeGeneration() {
    this.autoGenerateBarcode = !this.autoGenerateBarcode;
  }

  /**
   * Alterna a descrição obrigatória
   */
  toggleDescriptionRequired() {
    this.descriptionRequired = !this.descriptionRequired;
  }

  /**
   * Salva as configurações
   */
  saveSettings(): void {
    this.isSavingSettings = true;

    const activeUnits = this.unitsOfMeasure.filter(unit => unit.active).map(unit => ({
      id: unit.id,
      name: unit.name,
      abbreviation: unit.abbreviation || '',
      active: unit.active,
      lowStockThreshold: unit.low_stock_threshold
    }));

    const settings: ProductSettingsCreationModel = {
      unitsOfMeasure: activeUnits,
      autoGenerateBarcode: this.autoGenerateBarcode,
      descriptionRequired: this.descriptionRequired
    };

    this.productSettingsService.updateProductSettings({ productSettings: settings, isSkipLoading: true }).subscribe({
      next: (savedSettings: ProductSettingsModel) => {
        this.toastService.success('Configurações salvas com sucesso!');
        this.isSavingSettings = false;
      },
      error: (updateError: any) => {
        if (updateError.status === 404) {
          this.productSettingsService.saveProductSettings({ productSettings: settings, isSkipLoading: true }).subscribe({
            next: (savedSettings: ProductSettingsModel) => {
              this.toastService.success('Configurações salvas com sucesso!');
              this.isSavingSettings = false;
            },
            error: (createError: any) => {
              this.toastService.error(createError.error?.message || 'Erro ao salvar configurações');
              this.isSavingSettings = false;
            }
          });
        } else {
          this.toastService.error(updateError.error?.message || 'Erro ao salvar configurações');
          this.isSavingSettings = false;
        }
      }
    });
  }
}