import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { PaginatedItemsModel } from '../models/paginated-items.model';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { ItemCreationModel } from '../models/item-creation.model';
import { ItemModel } from '../models/item.model';
import { CategoryModel } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class ItemsService {
  private readonly baseUrl = `${environment.apiUrl}/item`

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  })

  private itemData: BehaviorSubject<PaginatedItemsModel>;
  $itemData: Observable<PaginatedItemsModel>;

  private allItemData: BehaviorSubject<ItemModel[]>
  $allItemData: Observable<ItemModel[]>;

  private categoryData: BehaviorSubject<CategoryModel[]>
  $categoryData: Observable<CategoryModel[]>;

  constructor(private http: HttpClient, private authService: AuthService) {
    const storedItemData = sessionStorage.getItem('itemData');
    const storedAllItemData = sessionStorage.getItem('allItemData');
    const storedCategoryData = sessionStorage.getItem('categoryData');

    this.itemData = new BehaviorSubject<PaginatedItemsModel>(storedItemData ? JSON.parse(storedItemData) : {} as PaginatedItemsModel);
    this.allItemData = new BehaviorSubject<ItemModel[]>(storedAllItemData ? JSON.parse(storedAllItemData) : [] as ItemModel[]);
    this.categoryData = new BehaviorSubject<CategoryModel[]>(storedCategoryData ? JSON.parse(storedCategoryData) : [] as CategoryModel[]);

    this.$itemData = this.itemData.asObservable();
    this.$allItemData = this.allItemData.asObservable();
    this.$categoryData = this.categoryData.asObservable();
  }

  /**
   * Define os dados dos itens
   * @param data - Dados dos itens
   */
  setItemData(data: PaginatedItemsModel) {
    this.itemData.next(data);

    sessionStorage.setItem('itemData', JSON.stringify(data));
  }

  /**
   * Define todos os dados dos itens
   * @param data - Dados dos itens
   */
  setAllItemsData(data: ItemModel[]) {
    this.allItemData.next(data);
    sessionStorage.setItem('allItemData', JSON.stringify(data));
  }

  /**
   * Define os dados das categorias
   * @param data - Dados das categorias
   */
  setCategoryData(data: CategoryModel[]) {
    this.categoryData.next(data);
    sessionStorage.setItem('categoryData', JSON.stringify(data));
  }

  /**
   * Obtém os dados paginados dos itens
   * @param page - Página
   * @param limit - Limite
   * @param isIgnoringLoading - Se deve ignorar o loading
   * @returns Observable com os dados paginados dos itens
   */
  getPaginatedItems(page: string, limit: number, isIgnoringLoading: boolean = false): Observable<PaginatedItemsModel> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    this.headers = this.headers.set('X-Skip-Loading', isIgnoringLoading ? 'true' : 'false');
    const accountId = this.authService.getAccountId();

    return this.http.get<PaginatedItemsModel>(`${this.baseUrl}/${accountId}/paginated?offset=${page}&limit=${limit}`, {
      headers: this.headers
    }).pipe((tap((data: any) => {
      this.setItemData(data);
    })));
  }

  /**
   * Pesquisa os itens
   * @param searchTerm - Termo de pesquisa
   * @param limit - Limite
   * @returns Observable com os dados pesquisados
   */
  searchItems(searchTerm: string, limit: number = 50): Observable<ItemModel[]> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    this.headers = this.headers.set('X-Skip-Loading', 'true'); // Skip global loading for search
    const accountId = this.authService.getAccountId();

    return this.http.get<ItemModel[]>(`${this.baseUrl}/${accountId}/search?term=${encodeURIComponent(searchTerm)}&limit=${limit}`, {
      headers: this.headers
    });
  }

  /**
   * Obtém todos os itens
   * @returns Observable com os dados de todos os itens
   */
  getAllItems(): Observable<ItemModel[]> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const accountId = this.authService.getAccountId();

    return this.http.get<ItemModel[]>(`${this.baseUrl}/${accountId}`, {
      headers: this.headers
    }).pipe((tap((data: ItemModel[]) => {
      this.setAllItemsData(data);
    })));
  }

  /**
   * Cria um item
   * @param item - Dados do item
   * @returns Observable com o dado criado
   */
  createItem(item: ItemCreationModel): Observable<ItemModel> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const accountId = this.authService.getAccountId();
    const accountUserId = this.authService.getAccountUserId();
    const itemData = JSON.parse(sessionStorage.getItem('itemData')!!);

    return this.http.post<ItemModel>(`${this.baseUrl}/register-item/${accountId}`, {
      ...item,
      account_id: accountId,
      account_user_id: accountUserId
    }, {
      headers: this.headers
    }).pipe((tap((data: ItemModel) => {
      const paginatedItems = {
        data: [...itemData.data, data],
        nextCursor: itemData.nextCursor,
      }
      this.setItemData(paginatedItems as PaginatedItemsModel);
    })))
  }

  /**
   * Atualiza um item
   * @param id - ID do item
   * @param item - Dados do item
   * @returns Observable com o dado atualizado
   */
  updateItem(id: string, item: ItemCreationModel): Observable<ItemModel> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const itemData = JSON.parse(sessionStorage.getItem('itemData')!!);

    return this.http.put<ItemModel>(`${this.baseUrl}/update-item/${id}`, {
      ...item,
      account_id: this.authService.getAccountId(),
      account_user_id: this.authService.getAccountUserId(),

    }, {
      headers: this.headers
    }).pipe((tap((data: ItemModel) => {
      const paginatedItems = {
        data: itemData.data.map((item: ItemModel) => item.id === id ? data : item),
        nextCursor: itemData.nextCursor,
      }

      this.setItemData(paginatedItems as PaginatedItemsModel);
    })))
  }

  /**
   * Importa itens
   * @param file - Arquivo
   * @returns Observable com os dados importados
   */
  importItems(file: File): Observable<any> {
    const formData = new FormData();

    const accountId = this.authService.getAccountId();
    const accountUserId = this.authService.getAccountUserId();

    formData.append('file', file);
    if (accountId && accountUserId) {
      formData.append('account_id', accountId);
      formData.append('account_user_id', accountUserId);
    }

    return this.http.post<any>(`${this.baseUrl}/import`, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`,
        'X-Skip-Loading': 'true'
      })
    }).pipe(tap(data => data));
  }

  /**
   * Importa categorias
   * @param file - Arquivo
   * @returns Observable com os dados importados
   */
  importCategories(file: File): Observable<any> {
    const formData = new FormData();

    const accountId = this.authService.getAccountId();
    const accountUserId = this.authService.getAccountUserId();

    formData.append('file', file);
    if (accountId && accountUserId) {
      formData.append('account_id', accountId);
    }

    return this.http.post<any>(`${this.baseUrl}/categories/import`, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`,
        'X-Skip-Loading': 'true'
      })
    }).pipe(tap(data => data));
  }

  /**
   * Obtém o status de importação
   * @param jobId - ID do job
   * @returns Observable com o status de importação
   */
  getImportStatus(jobId: string): Observable<{ status: string, result: any }> {
    return this.http.get<{ status: string, result: any }>(`${this.baseUrl}/import/status/${jobId}`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });
  }

  /**
   * Deleta um item
   * @param id - ID do item
   * @returns Observable com o dado deletado
   */
  deleteItem(id: string): Observable<PaginatedItemsModel> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const itemData = JSON.parse(sessionStorage.getItem('itemData')!!);

    return this.http.delete<PaginatedItemsModel>(`${this.baseUrl}/delete-item/${id}`, {
      headers: this.headers
    }).pipe((tap((data: PaginatedItemsModel) => {
      const paginatedItems = {
        data: itemData.data.filter((item: ItemModel) => item.id !== id),
        nextCursor: itemData.nextCursor,
      }

      this.setItemData(paginatedItems as PaginatedItemsModel);
    })))
  }

  /**
   * Cria uma categoria
   * @param category - Dados da categoria
   * @returns Observable com o dado criado
   */
  createCategory(category: CategoryModel): Observable<CategoryModel> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const accountId = this.authService.getAccountId();
    const categories = JSON.parse(sessionStorage.getItem('categoryData')!!);

    return this.http.post<CategoryModel>(`${this.baseUrl}/categories/${accountId}`, category, {
      headers: this.headers
    }).pipe((tap((data: CategoryModel) => {
      const categoryData = [...categories, data]
      this.setCategoryData(categoryData as unknown as CategoryModel[]);
    })))
  }

  /**
   * Atualiza uma categoria
   * @param id - ID da categoria
   * @param category - Dados da categoria
   * @returns Observable com o dado atualizado
   */
  updateCategory(id: string, category: CategoryModel): Observable<CategoryModel> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const categories = JSON.parse(sessionStorage.getItem('categoryData')!!);

    return this.http.put<CategoryModel>(`${this.baseUrl}/categories/${id}`, category, {
      headers: this.headers
    }).pipe((tap((data: CategoryModel) => {
      const categoryData = categories.map((cat: CategoryModel) => cat.id === id ? data : cat)
      this.setCategoryData(categoryData as unknown as CategoryModel[]);
    })))
  }

  /**
   * Obtém todas as categorias
   * @returns Observable com os dados de todas as categorias
   */
  getCategories(): Observable<any> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const accountId = this.authService.getAccountId();

    return this.http.get<any>(`${this.baseUrl}/categories/${accountId}`, {
      headers: this.headers
    }).pipe((tap((data: CategoryModel[]) => {
      this.setCategoryData(data);
    })))
  }

  /**
   * Deleta uma categoria
   * @param categoryId - ID da categoria
   * @returns Observable com o dado deletado
   */
  deleteCategory(categoryId: string): Observable<any> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const accountId = this.authService.getAccountId();

    return this.http.delete<any>(`${this.baseUrl}/categories/${accountId}/${categoryId}`, {
      headers: this.headers
    }).pipe((tap((data: any) => {
      return data;
    })))
  }
}
