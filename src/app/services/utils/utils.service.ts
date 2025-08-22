import { Injectable } from '@angular/core';

import { Crown, Shield, Zap } from 'lucide-angular';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  readonly shieldIcon = Shield;
  readonly crownIcon = Crown;
  readonly zapIcon = Zap;

  constructor() { }

  /**
   * Sanitiza o nome do plano para retornar o ícone correspondente
   * @param planName - Nome do plano
   * @returns Ícone correspondente ao plano
   */
  sanitizeIcon(planName: string): any {
    if (planName === 'Ouro') return this.crownIcon;
    if (planName === 'Bronze') return this.shieldIcon;
    if (planName === 'Prata') return this.zapIcon;
  }
}
