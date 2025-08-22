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
}
