import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { MovementationModel, PaginatedMovementationModel, MovementationFilters, MovementationType } from '../models/movementation.model';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ItemsService } from './items.service';
import { ItemModel } from '../models/item.model';
import { PaginatedItemsModel } from '../models/paginated-items.model';

@Injectable({
  providedIn: 'root'
})
export class MovementationService {
  private readonly apiUrl: string = `${environment.apiUrl}/movementation`;

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  private movementationData = new BehaviorSubject<PaginatedMovementationModel>({} as PaginatedMovementationModel);
  $movementationData = this.movementationData.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly itemService: ItemsService
  ) { }

  /**
   * Define os dados de movimentação no BehaviorSubject e no sessionStorage
   */
  setMovementationData(data: PaginatedMovementationModel) {
    this.movementationData.next(data);
    sessionStorage.setItem('movementationData', JSON.stringify(data));
  }

  /**
   * Adiciona o token de autenticação e o cabeçalho de skip loading
   */
  private withAuth(skipLoading: boolean = false): HttpHeaders {
    let h = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    if (skipLoading) h = h.set('X-Skip-Loading', 'true');
    return h;
  }

  /**
   * Obtém os dados de movimentação do sessionStorage
   */
  private fetchMovementationData(): PaginatedMovementationModel {
    return JSON.parse(sessionStorage.getItem('movementationData') || '{}');
  }

  /**
   * Obtém os dados paginados de movimentações
   */
  getPaginated(
    cursor: string = '',
    limit: number = 10,
    filters?: MovementationFilters
  ): Observable<PaginatedMovementationModel> {
    const accountId = this.authService.getAccountId();
    const params = new URLSearchParams();
    
    if (cursor) params.set('offset', cursor);
    params.set('limit', String(limit));
    if (filters?.moveType) params.set('move_type', filters.moveType);
    if (filters?.itemId) params.set('item_id', filters.itemId);
    if (filters?.userId) params.set('user_id', filters.userId);
    if (filters?.startDate) {
      const startDate = typeof filters.startDate === 'string' ? filters.startDate : filters.startDate.toISOString().split('T')[0];
      params.set('start_date', startDate);
    }
    if (filters?.endDate) {
      const endDate = typeof filters.endDate === 'string' ? filters.endDate : filters.endDate.toISOString().split('T')[0];
      params.set('end_date', endDate);
    }
    if (filters?.search) params.set('search', filters.search);

    return this.http.get<PaginatedMovementationModel>(`${this.apiUrl}/account/${accountId}/paginated?${params.toString()}`, {
      headers: this.withAuth()
    }).pipe(tap((data: PaginatedMovementationModel) => this.setMovementationData(data)));
  }

  /**
   * Obtém todas as movimentações (sem paginação)
   */
  getMovementations(accountId?: string): Observable<MovementationModel[]> {
    const id = accountId || this.authService.getAccountId();
    return this.http.get<MovementationModel[]>(`${this.apiUrl}/account/${id}`, {
      headers: this.withAuth(true)
    });
  }

  /**
   * Obtém os tipos de movimentação disponíveis
   */
  getMovementationTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/types`, {
      headers: this.withAuth(true)
    });
  }

  /**
   * Cria uma nova movimentação
   */
  moveItem(movementation: MovementationModel): Observable<ItemModel> {
    const accountId = this.authService.getAccountId();
    const accountUserId = this.authService.getAccountUserId();

    return this.http.post<ItemModel>(`${this.apiUrl}/${accountId}`, {
      ...movementation,
      account_id: accountId,
      account_user_id: accountUserId,
    }, {
      headers: this.withAuth()
    }).pipe(tap((updatedItem: ItemModel) => {
      // Atualizar os dados do item no service de itens
      const itemData = JSON.parse(sessionStorage.getItem('itemData') || '{}');
      if (itemData.data) {
        const paginatedItems = {
          data: itemData.data.map((item: ItemModel) => 
            item.id === movementation.item_id ? updatedItem : item
          ),
          nextCursor: itemData.nextCursor,
        };
        this.itemService.setItemData(paginatedItems as PaginatedItemsModel);
      }
    }));
  }

  /**
   * Reverte uma movimentação criando uma movimentação oposta
   */
  revertMovementation(movementationId: string): Observable<ItemModel> {
    return this.http.delete<ItemModel>(`${this.apiUrl}/${movementationId}`, {
      headers: this.withAuth()
    });
  }

  /**
   * Obtém o tipo oposto para reversão
   */
  getOppositeMovementType(currentType: string): MovementationType {
    switch (currentType) {
      case MovementationType.ENTRADA:
        return MovementationType.SAIDA;
      case MovementationType.SAIDA:
        return MovementationType.ENTRADA;
      case MovementationType.VENDA:
        return MovementationType.ENTRADA; // Reverte venda como entrada
      case MovementationType.TRANSFERENCIA:
        return MovementationType.TRANSFERENCIA; // Transferência reversa
      case MovementationType.AJUSTE:
        return MovementationType.AJUSTE; // Ajuste reverso
      default:
        return MovementationType.AJUSTE;
    }
  }

  /**
   * Obtém a cor do badge para cada tipo de movimentação
   */
  getMovementTypeColor(type: string): string {
    switch (type) {
      case MovementationType.ENTRADA:
        return 'bg-green-100 text-green-600 border border-green-200';
      case MovementationType.SAIDA:
        return 'bg-red-100 text-red-600 border border-red-200';
      case MovementationType.VENDA:
        return 'bg-purple-100 text-purple-600 border border-purple-200';
      case MovementationType.TRANSFERENCIA:
        return 'bg-blue-100 text-blue-600 border border-blue-200';
      case MovementationType.AJUSTE:
        return 'bg-orange-100 text-orange-600 border border-orange-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  }

  /**
   * Obtém o ícone para cada tipo de movimentação
   */
  getMovementTypeIcon(type: string): string {
    switch (type) {
      case MovementationType.ENTRADA:
        return 'trending-up'; // Seta para cima
      case MovementationType.SAIDA:
        return 'trending-down'; // Seta para baixo
      case MovementationType.VENDA:
        return 'shopping-cart'; // Carrinho de compras
      case MovementationType.TRANSFERENCIA:
        return 'repeat'; // Setas bidirecionais
      case MovementationType.AJUSTE:
        return 'settings'; // Engrenagem
      default:
        return 'package';
    }
  }

  /**
   * Obtém o texto amigável para cada tipo de movimentação
   */
  getMovementTypeLabel(type: string): string {
    switch (type) {
      case MovementationType.ENTRADA:
        return 'Entrada';
      case MovementationType.SAIDA:
        return 'Saída';
      case MovementationType.VENDA:
        return 'Venda';
      case MovementationType.TRANSFERENCIA:
        return 'Transferência';
      case MovementationType.AJUSTE:
        return 'Ajuste';
      default:
        return type;
    }
  }
}
