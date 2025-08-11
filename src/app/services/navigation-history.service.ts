import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NavigationHistoryService {
  private navigationHistory: string[] = [];
  private maxHistorySize = 10;

  constructor(private router: Router) {
    // Capturar todas as navegações para construir o histórico
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.addToHistory(event.url);
      });
  }

  /**
   * Adiciona uma URL ao histórico de navegação
   */
  private addToHistory(url: string): void {
    // Não adicionar URLs duplicadas consecutivas
    if (this.navigationHistory[this.navigationHistory.length - 1] !== url) {
      this.navigationHistory.push(url);
      
      // Manter apenas as últimas N URLs
      if (this.navigationHistory.length > this.maxHistorySize) {
        this.navigationHistory.shift();
      }
    }
  }

  /**
   * Obtém a URL anterior
   */
  getPreviousUrl(): string | null {
    if (this.navigationHistory.length < 2) {
      return null;
    }
    
    // Retornar a penúltima URL (excluindo a atual)
    return this.navigationHistory[this.navigationHistory.length - 2];
  }

  /**
   * Obtém a URL anterior que seja login ou register
   */
  getPreviousAuthUrl(): string | null {
    for (let i = this.navigationHistory.length - 2; i >= 0; i--) {
      const url = this.navigationHistory[i];
      if (url.includes('/login') || url.includes('/register')) {
        return url;
      }
    }
    return null;
  }

  /**
   * Navega de volta para a rota anterior (login ou register)
   */
  goBack(): void {
    const previousAuthUrl = this.getPreviousAuthUrl();
    
    if (previousAuthUrl) {
      this.router.navigate([previousAuthUrl]);
    } else {
      // Fallback: voltar para register se não conseguir determinar a rota anterior
      this.router.navigate(['/register']);
    }
  }

  /**
   * Obtém o histórico completo (para debug)
   */
  getHistory(): string[] {
    return [...this.navigationHistory];
  }

  /**
   * Limpa o histórico
   */
  clearHistory(): void {
    this.navigationHistory = [];
  }
}
