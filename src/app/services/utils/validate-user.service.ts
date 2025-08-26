import { Injectable } from "@angular/core";

import { AccountUserType } from "../../models/account_user.model";

@Injectable({
  providedIn: 'root'
})
export class ValidateUserService {
  constructor() {}

  /**
   * Verifica se o usuário é dono
   * @param type - Tipo de usuário
   * @returns true se o usuário é dono, false caso contrário
   */
  isOwnerOrManager(type: AccountUserType): boolean {
    return type === AccountUserType.OWNER || type === AccountUserType.ADMIN;
  }
}