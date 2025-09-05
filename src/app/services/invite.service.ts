import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InviteService {
  private readonly API_URL_INVITES = `${environment.apiUrl}`;
  private readonly API_URL_PUBLIC_INVITES = `${environment.apiUrl}/public/invite`;

  constructor(private readonly http: HttpClient) { }

  /**
   * Valida o token de convite
   * @param token - Token de convite
   * @returns Observable com os dados do convite
   */
  validateInviteToken(token: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL_PUBLIC_INVITES}/${token}`);
  }

  /**
   * Rejeita um convite
   * @param inviteId - ID do convite
   * @returns Observable com os dados do convite
   */
  rejectInvite(inviteId: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL_PUBLIC_INVITES}/${inviteId}/reject`);
  }
}
