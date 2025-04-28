import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { PaginatedItemsModel } from '../models/paginated-items.model';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { ItemCreationModel } from '../models/item-creation.model';
import { ItemModel } from '../models/item.model';

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

  constructor(private http: HttpClient, private authService: AuthService) { }

  setItemData(data: PaginatedItemsModel) {
    this.itemData.next(data);

    sessionStorage.setItem('itemData', JSON.stringify(data));

    if (data.nextCursor && data.nextCursor !== '') {
      const storage = localStorage.getItem('remember_me') === 'true' ? localStorage : sessionStorage;
      storage.setItem('nextCursor', data.nextCursor);
    }
  }

  getPaginatedItems(page: string, limit: number): Observable<PaginatedItemsModel> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const accountId = this.authService.getAccountId();

    return this.http.get<PaginatedItemsModel>(`${this.baseUrl}/${accountId}/paginated?offset=${page}&limit=${limit}`, {
      headers: this.headers
    }).pipe((tap((data: PaginatedItemsModel) => {
      this.setItemData(data);
    })))
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
}
