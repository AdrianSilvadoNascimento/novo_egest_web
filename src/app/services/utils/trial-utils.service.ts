import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TrialUtilsService {

  constructor() { }

  /**
   * Calcula os dias restantes do período de teste
   * @param trialStartDate Data de início do trial
   * @returns Número de dias restantes (negativo se expirado)
   */
  calculateTrialDays(trialStartDate: Date | string): number {
    if (!trialStartDate) return 0;
    
    const startDate = new Date(trialStartDate);
    const currentDate = new Date();
    
    // Calcula a diferença em milissegundos
    const timeDiff = startDate.getTime() + (13 * 24 * 60 * 60 * 1000) - currentDate.getTime();
    
    // Converte para dias
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff;
  }

  /**
   * Verifica se o trial está expirado
   * @param trialStartDate Data de início do trial
   * @returns true se o trial expirou
   */
  isTrialExpired(trialStartDate: Date | string): boolean {
    return this.calculateTrialDays(trialStartDate) <= 0;
  }

  /**
   * Verifica se o trial está próximo de expirar (últimos 3 dias)
   * @param trialStartDate Data de início do trial
   * @returns true se o trial está próximo de expirar
   */
  isTrialNearExpiration(trialStartDate: Date | string): boolean {
    const daysLeft = this.calculateTrialDays(trialStartDate);
    return daysLeft > 0 && daysLeft <= 3;
  }
}
