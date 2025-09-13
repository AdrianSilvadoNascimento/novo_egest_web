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
  imports: [CommonModule, MatExpansionModule, CustomToggleComponent],
  templateUrl: './products-settings.component.html',
  styleUrl: './products-settings.component.scss'
})
export class ProductsSettingsComponent implements OnInit {
  currentAccountUser: AccountUserModel = new AccountUserModel();
  unitsOfMeasure: UnitOfMeasureModel[] = [];

  // // Dados mockados das unidades de medidas
  // unitsOfMeasure: UnitOfMeasure[] = [
  //   { id: 1, name: UnitOfMeasureType.SACA, abbreviation: UnitOfMeasureAbbreviation.S, active: true, lowStockThreshold: 5 },
  //   { id: 2, name: UnitOfMeasureType.FARDO, abbreviation: UnitOfMeasureAbbreviation.F, active: true, lowStockThreshold: 10 },
  //   { id: 3, name: UnitOfMeasureType.UNIDADE, abbreviation: UnitOfMeasureAbbreviation.UN, active: true, lowStockThreshold: 20 },
  //   { id: 4, name: UnitOfMeasureType.KG, abbreviation: UnitOfMeasureAbbreviation.KG, active: true, lowStockThreshold: 50 },
  //   { id: 5, name: UnitOfMeasureType.GRAMAS, abbreviation: UnitOfMeasureAbbreviation.G, active: true, lowStockThreshold: 1000 },
  //   { id: 6, name: UnitOfMeasureType.METROS, abbreviation: UnitOfMeasureAbbreviation.M, active: true, lowStockThreshold: 100 },
  //   { id: 7, name: UnitOfMeasureType.CENTIMETROS, abbreviation: UnitOfMeasureAbbreviation.CM, active: true, lowStockThreshold: 500 },
  //   { id: 8, name: UnitOfMeasureType.LITROS, abbreviation: UnitOfMeasureAbbreviation.L, active: true, lowStockThreshold: 25 },
  //   { id: 9, name: UnitOfMeasureType.MILILITROS, abbreviation: UnitOfMeasureAbbreviation.ML, active: true, lowStockThreshold: 5000 }
  // ];

  // Configurações avançadas
  autoGenerateBarcode: boolean = false;
  descriptionRequired: boolean = false;

  constructor(
    private readonly toastService: ToastService,
    private readonly accountUserService: AccountUserService,
    private readonly unitOfMeasureService: UnitOfMeasureService,
    readonly validateUserService: ValidateUserService,
  ) { }

  ngOnInit(): void {
    this.getCurrentAccountUser();
  }

  /**
   * Obtém os dados do usuário atual
   */
  getCurrentAccountUser(): void {
    this.accountUserService.$accountUserData.subscribe({
      next: (accountUser: AccountUserModel) => {
        this.currentAccountUser = accountUser;
        this.getUnitsOfMeasure();
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
  saveSettings() {
    const activeUnits = this.unitsOfMeasure.filter(unit => unit.active).map(unit => ({
      id: unit.id,
      name: unit.name,
      abbreviation: unit.abbreviation,
      active: unit.active,
      lowStockThreshold: unit.low_stock_threshold
    }));
    const settings = {
      unitsOfMeasure: activeUnits,
      autoGenerateBarcode: this.autoGenerateBarcode,
      descriptionRequired: this.descriptionRequired
    };

    console.log('Configurações salvas:', settings);
    // TODO: Enviar para o backend quando estiver pronto
  }
}