import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

import { Crown, Shield, Zap } from 'lucide-angular';

import { AccountUserType, AccountUserRole } from '../../models/account_user.model';
import { InviteStatus } from '../../models/invite.model';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  readonly shieldIcon = Shield;
  readonly crownIcon = Crown;
  readonly zapIcon = Zap;

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  constructor(
    private readonly authService: AuthService
  ) { }

  /**
   * Adiciona o token de autenticação ao headers
   * @param skipLoading - se o loading deve ser ignorado
   * @returns headers com o token de autenticação
   */
  withAuth(skipLoading: boolean = false): HttpHeaders {
    let header = this.headers.set('Authorization', `Bearer ${this.authService.getToken()}`);
    if (skipLoading) header = header.set('X-Skip-Loading', 'true');
    return header;
  }

  /**
   * Sanitiza o nome do plano para retornar o ícone correspondente
   * @param planName - Nome do plano
   * @returns Ícone correspondente ao plano
   */
  sanitizeIcon(planName: string): any {
    switch(planName) {
      case 'Ouro': return this.crownIcon;
      case 'Bronze': return this.shieldIcon;
      case 'Prata': return this.zapIcon;
      default: return this.shieldIcon;
    }
  }

  /**
   * Sanitiza label de acordo com o tipo de usuário
   * @param type - Tipo de usuário
   * @returns Label correspondente ao tipo de usuário
   */
  sanitizeUserType(type: string): string {
    let label = '';
    
    switch(type) {
      case AccountUserType.OWNER:
        label = 'Dono';
        break;
      case AccountUserType.ADMIN:
        label = 'Administrador';
        break;
      case AccountUserType.USER:
        label = 'Usuário';
        break;
      default:
        label = 'Usuário';
        break;
    }

    return label;
  }

  /**
   * Sanitiza label de acordo com a role de usuário
   * @param role - Role de usuário
   * @returns Label correspondente à role de usuário
   */
  sanitizeUserRole(role: string): string {
    let label = '';

    switch(role) {
      case AccountUserRole.STORE_MANAGER:
        label = 'Gerente de Loja';
        break;
      case AccountUserRole.STOCKIST:
        label = 'Estoquista';
        break;
      case AccountUserRole.CASHIER:
        label = 'Caixa';
        break;
      case AccountUserRole.SELLER:
        label = 'Vendedor';
        break;
      default:
        label = 'Usuário';
        break;
    }

    return label;
  }

  /**
   * Sanitize bg color e text color de acordo com o tipo de usuário
   * @param type - Tipo de usuário
   * @returns Objeto com bg color e text color
   */
  sanitizeUserTypeColor(type: string): { bgColor: string, textColor: string } {
    switch(type) {
      case AccountUserType.OWNER:
        return { bgColor: 'bg-blue-100', textColor: 'text-blue-600' };
      case AccountUserType.ADMIN:
        return { bgColor: 'bg-green-100', textColor: 'text-green-600' };
      case AccountUserType.USER:
        return { bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
      default:
        return { bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
    }
  }

  /**
   * Sanitize bg color e text color de acordo com a role de usuário
   * @param role - Role de usuário
   * @returns Objeto com bg color e text color
   */
  sanitizeUserRoleColor(role: string): { bgColor: string, textColor: string } {
    switch(role) {
      case AccountUserRole.STORE_MANAGER:
        return { bgColor: 'bg-green-100', textColor: 'text-green-600' };
      case AccountUserRole.STOCKIST:
        return { bgColor: 'bg-blue-100', textColor: 'text-blue-600' };
      case AccountUserRole.CASHIER:
        return { bgColor: 'bg-red-100', textColor: 'text-red-600' };
      case AccountUserRole.SELLER:
        return { bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
      default:
        return { bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
    }
  }

  /**
   * Sanitiza o status do convite
   * @param status - Status do convite
   * @returns Status do convite sanitizado
   */
  sanitizeInviteStatus(status: InviteStatus): string {
    switch(status) {
      case InviteStatus.PENDING:
        return 'Pendente';
      case InviteStatus.ACCEPTED:
        return 'Aceito';
      case InviteStatus.EXPIRED:
        return 'Expirado';
      case InviteStatus.REJECTED:
        return 'Rejeitado';
      case InviteStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  }

  /**
   * Sanitize bg color e text color de acordo com o status do convite
   * @param status - Status do convite
   * @returns Objeto com bg color e text color
   */
  sanitizeInviteStatusColor(status: InviteStatus): { bgColor: string, textColor: string } {
    switch(status) {
      case InviteStatus.PENDING:
        return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' };
      case InviteStatus.ACCEPTED:
        return { bgColor: 'bg-green-100', textColor: 'text-green-600' };
      case InviteStatus.EXPIRED:
        return { bgColor: 'bg-red-100', textColor: 'text-red-600' };
      case InviteStatus.REJECTED:
        return { bgColor: 'bg-red-100', textColor: 'text-red-600' };
      case InviteStatus.CANCELLED:
        return { bgColor: 'bg-orange-100', textColor: 'text-orange-600' };
      default:
        return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' };
    }
  }
}
