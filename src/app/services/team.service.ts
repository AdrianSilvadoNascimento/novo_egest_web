import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly API_URL = `${environment.apiUrl}/team`;
  private readonly API_URL_INVITES = `${environment.apiUrl}/invites`;

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  private teamData: BehaviorSubject<any>;
  $teamData: Observable<any>;

  private invitesData: BehaviorSubject<any>;
  $invitesData: Observable<any>;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {
    const storedTeam = sessionStorage.getItem('teamData');
    const parsedTeam = storedTeam ? JSON.parse(storedTeam) : ({} as any);

    const storedInvites = sessionStorage.getItem('invitesData');
    const parsedInvites = storedInvites ? JSON.parse(storedInvites) : ({} as any);

    this.teamData = new BehaviorSubject<any>(parsedTeam);
    this.$teamData = this.teamData.asObservable();

    this.invitesData = new BehaviorSubject<any>(parsedInvites);
    this.$invitesData = this.invitesData.asObservable();
  }

  /**
   * Define os dados da equipe
   * @param teamData - Dados da equipe
   */
  setTeamData(teamData: any): void {
    this.teamData.next(teamData);
    sessionStorage.setItem('teamData', JSON.stringify(teamData));
  }

  /**
   * Define os dados dos convites
   * @param invitesData - Dados dos convites
   */
  setInvitesData(invitesData: any): void {
    this.invitesData.next(invitesData);
    sessionStorage.setItem('invitesData', JSON.stringify(invitesData));
  }

  /**
   * Adiciona o token de autenticação ao headers
   * @returns Headers com o token de autenticação
   */
  private withAuth(skipLoading: boolean = false): HttpHeaders {
    let header = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    if (skipLoading) header = header.set('X-Skip-Loading', 'true');
    return header;
  }

  /**
   * Obtém os dados da equipe
   * @returns Observable com os dados da equipe
   */
  getTeamData(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/members`, { headers: this.withAuth() }).pipe(
      tap(res => this.setTeamData(res))
    );
  }

  /**
   * Obtém os convites pendentes
   * @returns Observable com os convites pendentes
   */
  getPendingInvites(): Observable<any> {
    return this.http.get<any>(`${this.API_URL_INVITES}`, { headers: this.withAuth() }).pipe(
      tap(res => this.setInvitesData(res))
    );
  }

  /**
   * Invita um membro para a equipe
   * @param email - Email do membro
   * @param role - Função do membro
   * @param type - Tipo do membro
   * @returns Observable com os dados da equipe
   */
  inviteMember(inviteMember: { email: string, role: string, type: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL_INVITES}`, inviteMember, { headers: this.withAuth(true) }).pipe(
      tap(res => this.setTeamData(res))
    );
  }

  /**
   * Atualiza um membro da equipe
   * @param member - Membro a ser atualizado
   * @returns Observable com os dados da equipe
   */
  updateMember(member: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/members/${member.id}`, member, { headers: this.withAuth(true) }).pipe(
      tap(res => this.setTeamData(res))
    );
  }

  /**
   * Deleta um membro da equipe
   * @param memberId - ID do membro a ser deletado
   * @returns Observable com os dados da equipe
   */
  deleteMember(memberId: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/members/${memberId}`, { headers: this.withAuth(true) }).pipe(
      tap(res => this.setTeamData(res))
    );
  }

  /**
   * Cancela um convite
   * @param inviteId - ID do convite
   * @returns Observable com os dados da equipe
   */
  cancelInvite(inviteId: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL_INVITES}/${inviteId}/cancel`, { headers: this.withAuth(true) }).pipe(
      tap(res => this.setTeamData(res))
    );
  }

  /**
   * Reenvia um convite
   * @param inviteId - ID do convite
   * @returns Observable com os dados da equipe
   */
  resendInvite(inviteId: string): Observable<any> {
    return this.http.put<any>(`${this.API_URL_INVITES}/${inviteId}/resend`, { headers: this.withAuth(true) }).pipe(
      tap(res => this.setTeamData(res))
    );
  }
}
