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

  private itemData = new BehaviorSubject<PaginatedItemsModel>({} as PaginatedItemsModel);
  $itemData = this.itemData.asObservable();

  private allItemData = new BehaviorSubject<ItemModel[]>([] as ItemModel[]);
  $allItemData = this.allItemData.asObservable();

  private categoryData = new BehaviorSubject<CategoryModel[]>([] as CategoryModel[]);
  $categoryData = this.categoryData.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) { }

  setItemData(data: PaginatedItemsModel) {
    this.itemData.next(data);

    sessionStorage.setItem('itemData', JSON.stringify(data));
  }

  setAllItemsData(data: ItemModel[]) {
    this.allItemData.next(data);
    sessionStorage.setItem('allItemData', JSON.stringify(data));
  }

  setCategoryData(data: CategoryModel[]) {
    this.categoryData.next(data);
    sessionStorage.setItem('categoryData', JSON.stringify(data));
  }

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

  getAllItems(): Observable<ItemModel[]> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const accountId = this.authService.getAccountId();

    return this.http.get<ItemModel[]>(`${this.baseUrl}/${accountId}`, {
      headers: this.headers
    }).pipe((tap((data: ItemModel[]) => {
      this.setAllItemsData(data);
    })));
  }

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

  getImportStatus(jobId: string): Observable<{ status: string, result: any }> {
    return this.http.get<{ status: string, result: any }>(`${this.baseUrl}/import/status/${jobId}`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });
  }

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

  getCategories(): Observable<any> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const accountId = this.authService.getAccountId();

    return this.http.get<any>(`${this.baseUrl}/categories/${accountId}`, {
      headers: this.headers
    }).pipe((tap((data: CategoryModel[]) => {
      this.setCategoryData(data);
    })))
  }

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
