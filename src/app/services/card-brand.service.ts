import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CardBrandService {

  private readonly cardBrandSvgs: { [key: string]: string } = {
    'visa': `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#1A1F71"/>
      <path d="M44 8H4C2.89543 8 2 8.89543 2 10V22C2 23.1046 2.89543 24 4 24H44C45.1046 24 46 23.1046 46 22V10C46 8.89543 45.1046 8 44 8Z" fill="#1A1F71"/>
      <path d="M15.5 20L18.5 12H21L18 20H15.5ZM22.5 20L25.5 12H28L25 20H22.5ZM29.5 20L32.5 12H35L32 20H29.5ZM36.5 20L39.5 12H42L39 20H36.5Z" fill="white"/>
    </svg>`,
    
    'mastercard': `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#EB001B"/>
      <circle cx="16" cy="16" r="8" fill="#F79E1B"/>
      <circle cx="24" cy="16" r="8" fill="#FF5F00"/>
      <path d="M20 12C21.1046 12 22 12.8954 22 14V18C22 19.1046 21.1046 20 20 20H18C16.8954 20 16 19.1046 16 18V14C16 12.8954 16.8954 12 18 12H20Z" fill="white"/>
    </svg>`,
    
    'amex': `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#006FCF"/>
      <path d="M44 8H4C2.89543 8 2 8.89543 2 10V22C2 23.1046 2.89543 24 4 24H44C45.1046 24 46 23.1046 46 22V10C46 8.89543 45.1046 8 44 8Z" fill="#006FCF"/>
      <path d="M12 12L16 20L20 12H22L18 20L22 28H20L16 20L12 28H10L14 20L10 12H12ZM26 12H28V28H26V12ZM30 12H32V28H30V12ZM34 12H36V28H34V12Z" fill="white"/>
    </svg>`,
    
    'elo': `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#00A4E4"/>
      <path d="M44 8H4C2.89543 8 2 8.89543 2 10V22C2 23.1046 2.89543 24 4 24H44C45.1046 24 46 23.1046 46 22V10C46 8.89543 45.1046 8 44 8Z" fill="#00A4E4"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
      <circle cx="32" cy="16" r="6" fill="white"/>
      <path d="M24 10L28 16L24 22H20L16 16L20 10H24Z" fill="#00A4E4"/>
    </svg>`,
    
    'discover': `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#FF6000"/>
      <path d="M44 8H4C2.89543 8 2 8.89543 2 10V22C2 23.1046 2.89543 24 4 24H44C45.1046 24 46 23.1046 46 22V10C46 8.89543 45.1046 8 44 8Z" fill="#FF6000"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
      <path d="M24 10L28 16L24 22H20L16 16L20 10H24Z" fill="#FF6000"/>
    </svg>`,
    
    'default': `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#6B7280"/>
      <path d="M44 8H4C2.89543 8 2 8.89543 2 10V22C2 23.1046 2.89543 24 4 24H44C45.1046 24 46 23.1046 46 22V10C46 8.89543 45.1046 8 44 8Z" fill="#6B7280"/>
      <rect x="8" y="12" width="32" height="8" rx="2" fill="white"/>
      <rect x="8" y="22" width="16" height="2" rx="1" fill="white"/>
    </svg>`
  };

  /**
   * Obtém o SVG da bandeira do cartão
   * @param brand - Nome da bandeira
   * @returns SVG string da bandeira
   */
  getCardBrandSvg(brand: string): string {
    const normalizedBrand = brand?.toLowerCase() || '';
    return this.cardBrandSvgs[normalizedBrand] || this.cardBrandSvgs['default'];
  }

  /**
   * Obtém todas as bandeiras disponíveis
   * @returns Array com nomes das bandeiras
   */
  getAvailableBrands(): string[] {
    return Object.keys(this.cardBrandSvgs).filter(brand => brand !== 'default');
  }

  /**
   * Verifica se uma bandeira é suportada
   * @param brand - Nome da bandeira
   * @returns true se a bandeira for suportada
   */
  isBrandSupported(brand: string): boolean {
    const normalizedBrand = brand?.toLowerCase() || '';
    return normalizedBrand in this.cardBrandSvgs && normalizedBrand !== 'default';
  }
}
