import { Injectable } from '@angular/core';
import { DashboardModel } from '../models/dashboard.model';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}/dashboard`

  private dashboardData = new BehaviorSubject<DashboardModel>({} as DashboardModel);
  $dashboardData = this.dashboardData.asObservable();

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  })

  private accountId!: string | null

  constructor(private http: HttpClient, private authService: AuthService) { }

  setDashboardData(data: DashboardModel): void {
    this.dashboardData.next(data);
    sessionStorage.setItem('dashboardData', JSON.stringify(data));
  }

  getDashboardData(): Observable<DashboardModel> {
    this.accountId = this.authService.getAccountId()
    this.headers = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`)
    return this.http.get<DashboardModel>(`${this.API_URL}/${this.accountId}`, { headers: this.headers }).pipe(
      tap((data: DashboardModel) => {
        // Adicionar dados de crescimento temporários se não vieram da API
        const enrichedData: DashboardModel = {
          ...data,
          lowStock: data.lowStock || 23,
          productsGrowth: data.productsGrowth || 12,
          enteredsGrowth: data.enteredsGrowth || 8,
          exitsGrowth: data.exitsGrowth || -3,
          lowStockStatus: data.lowStockStatus || 'Requer atenção',
          weeklyMovement: data.weeklyMovement || [
            { day: 'monday', dayLabel: 'Segunda', entries: 45, exits: 23 },
            { day: 'tuesday', dayLabel: 'Terça', entries: 32, exits: 18 },
            { day: 'wednesday', dayLabel: 'Quarta', entries: 58, exits: 31 },
            { day: 'today', dayLabel: 'Hoje', entries: 41, exits: 27 }
          ],
          weeklySummary: data.weeklySummary || {
            sales: 45230,
            productsSold: 189,
            newProducts: 12,
            activeClients: 67
          },
          lowStockProducts: data.lowStockProducts || [
            { id: '1', name: 'Smartphone Galaxy S23', category: 'Eletrônicos', currentQuantity: 3, minQuantity: 10, status: 'low' },
            { id: '2', name: 'Notebook Dell Inspiron', category: 'Eletrônicos', currentQuantity: 0, minQuantity: 5, status: 'out' },
            { id: '3', name: 'Tênis Nike Air Max', category: 'Esportes', currentQuantity: 2, minQuantity: 15, status: 'low' },
            { id: '4', name: 'Cafeteira Nespresso', category: 'Casa', currentQuantity: 1, minQuantity: 8, status: 'low' },
            { id: '5', name: 'Fone Bluetooth Sony', category: 'Eletrônicos', currentQuantity: 4, minQuantity: 12, status: 'low' }
          ],
          recentActivities: data.recentActivities || [
            { id: '1', type: 'entry', productName: 'iPhone 15 Pro', description: 'Entrada de 50 unidades', timestamp: 'Hoje, 14:30', user: 'João Silva' },
            { id: '2', type: 'exit', productName: 'MacBook Air M2', description: 'Saída de 3 unidades', timestamp: 'Hoje, 13:15', user: 'Maria Santos' },
            { id: '3', type: 'entry', productName: 'AirPods Pro', description: 'Entrada de 25 unidades', timestamp: 'Hoje, 11:45', user: 'Pedro Costa' },
            { id: '4', type: 'exit', productName: 'iPad Air', description: 'Saída de 2 unidades', timestamp: 'Hoje, 10:20', user: 'Ana Oliveira' },
            { id: '5', type: 'entry', productName: 'Apple Watch', description: 'Entrada de 15 unidades', timestamp: 'Ontem, 16:30', user: 'Carlos Lima' }
          ]
        };
        this.setDashboardData(enrichedData);
      })
    );
  }
}
