import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { UnitOfMeasureModel } from '../models/unit-of-measure.model';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { UtilsService } from './utils/utils.service';

@Injectable({
  providedIn: 'root'
})
export class UnitOfMeasureService {
  private readonly baseUrl = `${environment.apiUrl}/unit-of-measure`

  private unitOfMeasureData: BehaviorSubject<UnitOfMeasureModel[]>
  $unitOfMeasureData: Observable<UnitOfMeasureModel[]>;

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private utilsService: UtilsService
  ) {
    const storedUnitOfMeasureData = sessionStorage.getItem('unitOfMeasureData');
    const parsedUnitOfMeasureData = storedUnitOfMeasureData ? JSON.parse(storedUnitOfMeasureData) : [] as UnitOfMeasureModel[];

    this.unitOfMeasureData = new BehaviorSubject<UnitOfMeasureModel[]>(parsedUnitOfMeasureData);
    this.$unitOfMeasureData = this.unitOfMeasureData.asObservable();
  }

  /**
   * Obtém os dados das unidades de medida
   * @returns Observable com os dados das unidades de medida
   */
  setUnitOfMeasureData(unitsOfMeasure: UnitOfMeasureModel[]): void {
    sessionStorage.setItem('unitOfMeasureData', JSON.stringify(unitsOfMeasure));
    this.unitOfMeasureData.next(unitsOfMeasure);
  }

  /**
   * Obtém todas as unidades de medidas
   * @returns Observable com as unidades de medidas
   */
  getUnitsOfMeasure(): Observable<UnitOfMeasureModel[]> {    
    return this.http.get<UnitOfMeasureModel[]>(`${this.baseUrl}/${this.authService.getAccountId()}`, {
      headers: this.utilsService.withAuth()
    }).pipe(tap((unitsOfMeasure: UnitOfMeasureModel[]) => this.setUnitOfMeasureData(unitsOfMeasure)));
  }

  /**
   * Obtém apenas as unidades de medidas ativas
   * @returns Observable com as unidades de medidas ativas
   */
  getActiveUnitsOfMeasure(): Observable<UnitOfMeasureModel[]> {    
    return this.http.get<UnitOfMeasureModel[]>(`${this.baseUrl}/${this.authService.getAccountId()}/active`, {
      headers: this.utilsService.withAuth()
    }).pipe(tap((unitsOfMeasure: UnitOfMeasureModel[]) => this.setUnitOfMeasureData(unitsOfMeasure)));
  }

  /**
   * Cria uma nova unidade de medida
   * @param accountId - ID da conta
   * @param unit - Dados da unidade de medida
   * @returns Observable com a unidade criada
   */
  createUnitOfMeasure(unit: UnitOfMeasureModel): Observable<UnitOfMeasureModel> {    
    return this.http.post<UnitOfMeasureModel>(`${this.baseUrl}/${this.authService.getAccountId()}`, unit, {
      headers: this.utilsService.withAuth()
    });
  }

  /**
   * Atualiza uma unidade de medida
   * @param id - ID da unidade de medida
   * @param unit - Dados da unidade de medida
   * @returns Observable com a unidade atualizada
   */
  updateUnitOfMeasure(id: string, unit: UnitOfMeasureModel): Observable<UnitOfMeasureModel> {    
    return this.http.put<UnitOfMeasureModel>(`${this.baseUrl}/${id}`, unit, {
      headers: this.utilsService.withAuth()
    });
  }

  /**
   * Deleta uma unidade de medida
   * @param id - ID da unidade de medida
   * @returns Observable com a unidade deletada
   */
  deleteUnitOfMeasure(id: string): Observable<UnitOfMeasureModel> {
    return this.http.delete<UnitOfMeasureModel>(`${this.baseUrl}/${id}`, {
      headers: this.utilsService.withAuth()
    });
  }

  /**
   * Obtém uma unidade de medida por ID
   * @param id - ID da unidade de medida
   * @returns Observable com a unidade de medida
   */
  getUnitOfMeasureById(id: string): Observable<UnitOfMeasureModel> {
    return this.http.get<UnitOfMeasureModel>(`${this.baseUrl}/unit/${id}`, {
      headers: this.utilsService.withAuth()
    });
  }
}
