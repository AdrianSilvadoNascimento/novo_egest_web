import { Injectable } from '@angular/core';
import { DashboardModel } from '../models/dashboard.model';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';

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
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  })

  constructor(private http: HttpClient) { }

  setDashboardData(data: DashboardModel): void {
    this.dashboardData.next(data);
    localStorage.setItem('dashboardData', JSON.stringify(data));
  }

  getDashboardData(): Observable<DashboardModel> {
    const accountId = localStorage.getItem('account_id');
    return this.http.get<DashboardModel>(`${this.API_URL}/${accountId}`, { headers: this.headers }).pipe(
      tap((data: DashboardModel) => {
        this.setDashboardData(data);
      })
    );
  }
}
