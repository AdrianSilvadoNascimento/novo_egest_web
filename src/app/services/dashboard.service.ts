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
        this.setDashboardData(data);
      })
    );
  }
}
