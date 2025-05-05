import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { MovementationModel } from '../models/movementation.model';
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
  })

  private moveData = new BehaviorSubject<MovementationModel[]>([] as MovementationModel[]);
  $moveData = this.moveData.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly itemService: ItemsService
  ) { }

  setMoveData(data: MovementationModel[]) {
    this.moveData.next(data);
    sessionStorage.setItem('moveData', JSON.stringify(data));
  }

  moveItem(movementation: MovementationModel): Observable<MovementationModel> {
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    const accountId = this.authService.getAccountId();
    const accountUserId = this.authService.getAccountUserId();

    const itemData = JSON.parse(sessionStorage.getItem('itemData')!!);

    return this.http.post<MovementationModel>(`${this.apiUrl}/${accountId}`, {
      ...movementation,
      account_id: accountId,
      account_user_id: accountUserId,
    }, {
      headers: this.headers
    }).pipe((tap((data: MovementationModel) => {
      const paginatedItems = {
        data: itemData.data.map((item: ItemModel) => item.id === movementation.item_id ? data : item),
        nextCursor: itemData.nextCursor,
      }

      this.itemService.setItemData(paginatedItems as PaginatedItemsModel);
    })));
  }
}
