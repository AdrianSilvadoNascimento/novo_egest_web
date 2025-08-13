import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CustomerModel, PaginatedCustomersModel } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly baseUrl = `${environment.apiUrl}/customers`;
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  private customerData = new BehaviorSubject<PaginatedCustomersModel>({} as PaginatedCustomersModel);
  $customerData = this.customerData.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) { }

  /**
   * Define os dados do cliente no BehaviorSubject e no sessionStorage
   * @param data - dados do cliente
   */
  setCustomerData(data: PaginatedCustomersModel) {
    this.customerData.next(data);

    sessionStorage.setItem('customerData', JSON.stringify(data));
  }

  /**
   * Adiciona o token de autenticação e o cabeçalho de skip loading
   * @param skipLoading - se o loading deve ser ignorado
   * @returns headers com o token de autenticação e o cabeçalho de skip loading
   */
  private withAuth(skipLoading: boolean = false): HttpHeaders {
    let h = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    if (skipLoading) h = h.set('X-Skip-Loading', 'true');
    return h;
  }

  /**
   * Obtém os dados do cliente do sessionStorage
   * @returns dados do cliente
   */
  private fetchCustomerData(): any {
    return JSON.parse(sessionStorage.getItem('customerData')!!)
  }

  /**
   * Obtém os dados paginados de clientes
   * @param cursor - cursor da paginação
   * @param limit - limite de clientes por página
   * @param type - tipo de cliente
   * @param search - termo de busca
   * @returns dados paginados de clientes
   */
  getPaginated(cursor: string = '', limit: number = 10, type?: 'person' | 'business', search?: string): Observable<PaginatedCustomersModel> {
    const accountId = this.authService.getAccountId();
    const params = new URLSearchParams();
    if (cursor) params.set('offset', cursor);
    params.set('limit', String(limit));
    if (type) params.set('type', type);
    if (search) params.set('search', search);

    return this.http.get<PaginatedCustomersModel>(`${this.baseUrl}/${accountId}/paginated?${params.toString()}`, {
      headers: this.withAuth()
    }).pipe((tap((data: any) => this.setCustomerData(data))));
  }

  /**
   * Obtém os dados de clientes
   * @param search - termo de busca
   * @param limit - limite de clientes por página
   * @returns dados de clientes
   */
  search(search: string, limit: number = 50): Observable<CustomerModel[]> {
    const accountId = this.authService.getAccountId();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    
    return this.http.get<CustomerModel[]>(`${this.baseUrl}/${accountId}?${params.toString()}`, {
      headers: this.withAuth(true)
    });
  }

  /**
   * Cria um novo cliente
   * @param model - dados do cliente
   * @returns cliente criado
   */
  create(model: CustomerModel): Observable<CustomerModel> {
    const customerData = this.fetchCustomerData();
    
    return this.http.post<CustomerModel>(`${this.baseUrl}`, model, { headers: this.withAuth() })
    .pipe((tap((data: any) => {
      const paginatedCustomers = {
        data: [...customerData.data, data],
        nextCursor: customerData.nextCursor,
      };
      
      this.setCustomerData(paginatedCustomers as PaginatedCustomersModel);
    })));
  }

  /**
   * Atualiza um cliente
   * @param id - id do cliente
   * @param model - dados do cliente
   * @returns cliente atualizado
   */
  update(id: string, model: Partial<CustomerModel>): Observable<CustomerModel> {
    const customerData = this.fetchCustomerData();
    
    return this.http.put<CustomerModel>(`${this.baseUrl}/${id}`, model, { headers: this.withAuth() })
    .pipe((tap((data: any) => {
      const paginatedCustomers = {
        data: customerData.data.map((customer: CustomerModel) => customer.id === id ? data : customer),
        nextCursor: customerData.nextCursor,
      };

      this.setCustomerData(paginatedCustomers as PaginatedCustomersModel);
    })));
  }

  /**
   * Atualiza o status de um cliente
   * @param id - id do cliente
   * @param active - status do cliente
   * @returns cliente atualizado
   */
  updateStatus(id: string, active: boolean): Observable<CustomerModel> {
    return this.http.put<CustomerModel>(`${this.baseUrl}/${id}/status`, { active }, { headers: this.withAuth() });
  }

  /**
   * Deleta um cliente
   * @param id - id do cliente
   * @returns void
   */
  delete(id: string): Observable<void> {
    const customerData = this.fetchCustomerData();
    
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.withAuth() }).pipe(tap(() => {}))
    .pipe((tap((data: any) => {
      const paginatedCustomers = {
        data: customerData.data.filter((customer: CustomerModel) => customer.id !== id),
        nextCursor: customerData.nextCursor,
      };

      this.setCustomerData(paginatedCustomers as PaginatedCustomersModel);
    })));
  }

  /**
   * Obtém os clientes inativos
   * @param accountId - id da conta
   * @returns clientes inativos
   */
  listInactive(accountId: string): Observable<CustomerModel[]> {
    return this.http.get<CustomerModel[]>(`${this.baseUrl}/${accountId}/inactive`, { headers: this.withAuth(true) });
  }

  /**
   * Reativa um cliente
   * @param id - id do cliente
   * @returns mensagem de sucesso
   */
  reactivate(id: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/${id}/reactivate`, {}, { headers: this.withAuth() });
  }
}
