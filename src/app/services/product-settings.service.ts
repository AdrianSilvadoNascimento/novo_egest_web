import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { ProductSettingsModel, ProductSettingsCreationModel } from '../models/product-settings.model';
import { AuthService } from './auth.service';
import { UtilsService } from './utils/utils.service';

@Injectable({
  providedIn: 'root'
})
export class ProductSettingsService {
  private readonly baseUrl = `${environment.apiUrl}/product-settings`;

  private productSettingsData: BehaviorSubject<ProductSettingsModel | null>;
  $productSettingsData: Observable<ProductSettingsModel | null>;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private utilsService: UtilsService
  ) {
    const storedProductSettingsData = sessionStorage.getItem('productSettingsData');
    const parsedProductSettingsData = storedProductSettingsData ? JSON.parse(storedProductSettingsData) : null;

    this.productSettingsData = new BehaviorSubject<ProductSettingsModel | null>(parsedProductSettingsData);
    this.$productSettingsData = this.productSettingsData.asObservable();
  }

  /**
   * Define os dados das configurações de produtos no cache
   * @param productSettings - Configurações de produtos
   */
  setProductSettingsData(productSettings: ProductSettingsModel | null): void {
    if (productSettings) {
      sessionStorage.setItem('productSettingsData', JSON.stringify(productSettings));
    } else {
      sessionStorage.removeItem('productSettingsData');
    }
    this.productSettingsData.next(productSettings);
  }

  /**
   * Obtém as configurações de produtos
   * @returns Observable com as configurações de produtos
   */
  getProductSettings(): Observable<ProductSettingsModel> {
    return this.http.get<ProductSettingsModel>(`${this.baseUrl}/${this.authService.getAccountId()}`, {
      headers: this.utilsService.withAuth()
    }).pipe(
      tap((productSettings: ProductSettingsModel) => this.setProductSettingsData(productSettings))
    );
  }

  /**
   * Salva as configurações de produtos
   * @param productSettings - Configurações de produtos para salvar
   * @returns Observable com as configurações salvas
   */
  saveProductSettings({ productSettings, isSkipLoading }: { productSettings: ProductSettingsCreationModel, isSkipLoading: boolean }): Observable<ProductSettingsModel> {
    return this.http.post<ProductSettingsModel>(`${this.baseUrl}/${this.authService.getAccountId()}`, productSettings, {
      headers: this.utilsService.withAuth(isSkipLoading)
    }).pipe(
      tap((savedSettings: ProductSettingsModel) => this.setProductSettingsData(savedSettings))
    );
  }

  /**
   * Atualiza as configurações de produtos
   * @param productSettings - Configurações de produtos para atualizar
   * @returns Observable com as configurações atualizadas
   */
  updateProductSettings({ productSettings, isSkipLoading }: { productSettings: ProductSettingsCreationModel, isSkipLoading: boolean }): Observable<ProductSettingsModel> {
    return this.http.put<ProductSettingsModel>(`${this.baseUrl}/${this.authService.getAccountId()}`, productSettings, {
      headers: this.utilsService.withAuth(isSkipLoading)
    }).pipe(
      tap((updatedSettings: ProductSettingsModel) => this.setProductSettingsData(updatedSettings))
    );
  }

  /**
   * Limpa os dados das configurações do cache
   */
  clearProductSettingsData(): void {
    this.setProductSettingsData(null);
  }
}
