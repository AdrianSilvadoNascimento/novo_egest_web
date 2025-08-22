import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import EfiPay from "payment-token-efi";

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EfiService {
  private readonly payee_code: string = environment.payee_code;

  constructor() {
    this.checkScriptBlocking();
  }

  /**
   * Verifica se o script está bloqueado
   */
  async checkScriptBlocking(): Promise<void> {
    const isBlocked = await EfiPay.CreditCard.isScriptBlocked();

    const message = isBlocked ? "O script está bloqueado" : "O script não está bloqueado";
    console.log(message);
  }

  /**
   * Identifica a bandeira do cartão
   */
  async identifyBrand(cardNumber: string): Promise<Observable<string>> {
    try {
      const brand = await EfiPay.CreditCard
        .setCardNumber(cardNumber)
        .verifyCardBrand();
      
      return of(brand);
    } catch (error) {
      console.error(error);
      return of('');
    }
  }

  /**
   * Gera um token de pagamento
   * @param data - Dados do cartão
   * @returns Observable com o token e a máscara do cartão
   */
  async generateToken(data: {
    card_number: string,
    holder_name: string,
    expiration_month: string,
    expiration_year: string,
    security_code: string,
    cpf_cnpj: string,
    brand: string
  }): Promise<Observable<{ token: string, card_mask: string }>> {
    try {
      const env = environment.production ? "production" : "sandbox";
      const response = await EfiPay.CreditCard
        .setAccount(this.payee_code)
        .setEnvironment(env)
        .setCreditCardData({
          brand: data.brand,
          number: data.card_number,
          cvv: data.security_code,
          expirationMonth: data.expiration_month,
          expirationYear: data.expiration_year,
          holderName: data.holder_name,
          holderDocument: data.cpf_cnpj,
          reuse: true,
        })
        .getPaymentToken();

      const result = response as unknown as EfiPay.CreditCard.PaymentTokenResponse;
      const paymentToken = result.payment_token;
      const cardMask = result.card_mask;

      return of({ token: paymentToken, card_mask: cardMask });
    } catch (error) {
      console.error(error);
      return of({ token: '', card_mask: '' });
    }
  }

  /**
   * Sanitiza o status da fatura
   */
  sanitizePaymentStatus(status: string): string {
    switch (status) {
      case 'new':
        return 'Novo';
      case 'waiting':
        return 'Aguardando';
      case 'expired':
        return 'Expirado';
      case 'paid':
        return 'Pago';
      case 'unpaid':
        return 'Não pago';
      case 'refunded':
        return 'Reembolsado';
      case 'canceled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  /**
   * Retorna as classes CSS para o badge baseado no status do pagamento
   * @param status - O status do pagamento
   * @returns Objeto com classes de background e texto
   */
  getPaymentStatusClasses(status: string): { bgClass: string; textClass: string } {
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case 'paid':
      case 'pago':
      case 'approved':
      case 'aprovado':
        return {
          bgClass: 'bg-green-100',
          textClass: 'text-green-800'
        };
      
      case 'waiting':
      case 'aguardando':
      case 'pending':
      case 'pendente':
      case 'processing':
      case 'processando':
      case 'new':
      case 'novo':
        return {
          bgClass: 'bg-gray-100',
          textClass: 'text-gray-500'
        };
      
      case 'expired':
      case 'expirado':
      case 'overdue':
      case 'vencido':
        return {
          bgClass: 'bg-red-100',
          textClass: 'text-red-800'
        };
      
      case 'cancelled':
      case 'canceled':
      case 'cancelado':
      case 'refunded':
      case 'reembolsado':
        return {
          bgClass: 'bg-orange-100',
          textClass: 'text-orange-800'
        };
      
      case 'failed':
      case 'falhou':
      case 'error':
      case 'erro':
      case 'unpaid':
      case 'não pago':
        return {
          bgClass: 'bg-red-200',
          textClass: 'text-red-900'
        };
      
      case 'active':
      case 'ativo':
      case 'success':
      case 'sucesso':
        return {
          bgClass: 'bg-blue-100',
          textClass: 'text-blue-800'
        };
      
      default:
        return {
          bgClass: 'bg-gray-100',
          textClass: 'text-gray-800'
        };
    }
  }
}
