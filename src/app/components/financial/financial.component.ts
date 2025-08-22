import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { CurrencyPipe, registerLocaleData, DatePipe, TitleCasePipe } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Router } from '@angular/router';

import { MatCard } from "@angular/material/card";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { AlertCircle, Calendar, CreditCard, Crown, LucideAngularModule, RefreshCcw, TrendingUp } from "lucide-angular";

import { UtilsService } from '../../services/utils/utils.service';
import { PlanModel } from '../../models/plan.model';
import { CheckoutService } from '../../services/checkout.service';
import { ToastService } from '../../services/toast.service';
import { AccountModel, SubscriptionModel } from '../../models/account.model';
import { EfiService } from '../../services/utils/efi.service';

import { CardBrandIconComponent } from '../../shared/components';
import { AccountService } from '../../services/account.service';

registerLocaleData(localePt);

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [MatCard, LucideAngularModule, CurrencyPipe, DatePipe, MatProgressSpinner, CardBrandIconComponent, TitleCasePipe],
  templateUrl: './financial.component.html',
  styleUrl: './financial.component.scss',
  providers: [{
    provide: LOCALE_ID,
    useValue: "pt-BR"
  }]
})
export class FinancialComponent implements OnInit {
  readonly creditCardIcon = CreditCard;
  readonly calendarIcon = Calendar;
  readonly alertCircleIcon = AlertCircle;
  readonly refreshIcon = RefreshCcw;
  readonly crownIcon = Crown;
  readonly trendingUpIcon = TrendingUp;

  plan: PlanModel = new PlanModel();
  goldPlan: PlanModel = new PlanModel();
  subscription: SubscriptionModel = new SubscriptionModel();
  account: AccountModel = new AccountModel();

  acceptedBrands: { [key: string]: string } = {
    'visa': 'visa',
    'mastercard': 'mastercard',
    'americanexpress': 'american_express',
    'elo': 'elo',
  };

  // Array para controlar o loading de cada pagamento individualmente
  loadingPayments: string[] = [];

  constructor(
    readonly utilsService: UtilsService,
    readonly efiService: EfiService,
    private readonly router: Router,
    private readonly checkoutService: CheckoutService,
    private readonly toastService: ToastService,
    private readonly accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.fetchPlan();
    this.fetchPlanData();
    this.fetchSubscription();
    this.fetchAccount();
  }

  /**
   * Busca os dados da conta
   */
  fetchAccount(): void {
    this.accountService.getAccount().subscribe({
      next: (account: AccountModel) => {
        this.account = account;
      }, error: (error: any) => {
        this.toastService.error(error.message);
      }
    });
  }

  /**
   * Busca o plano atual
   */
  fetchPlan(): void {
    this.checkoutService.$subscriptionPlanData.subscribe({
      next: (plan: PlanModel) => {
        this.plan = plan;
      }, error: (error: any) => {
        this.toastService.error(error.message);
      }
    });

    if (this.plan.id) return;

    this.checkoutService.getSubscriptionPlanData().subscribe({
      next: (plan: PlanModel) => {
        this.plan = plan;
      }, error: (error: any) => {
        this.toastService.error(error.message);
      }
    })
  }

  /**
   * Busca os dados do plano
   */
  fetchPlanData(): void {
    this.checkoutService.$planData.subscribe((plan: PlanModel[]) => {
      this.goldPlan = plan.find(p => p.name === 'Ouro') || new PlanModel();
    });

    if (this.goldPlan.id) return;

    this.checkoutService.getPlans().subscribe((plan: PlanModel[]) => {
      this.goldPlan = plan.find(p => p.name === 'Ouro') || new PlanModel();
    });
  }

  /**
   * Busca a assinatura atual
   */
  fetchSubscription(): void {
    this.checkoutService.$subscriptionData.subscribe({
      next: (subscription: SubscriptionModel) => {
        this.subscription = subscription;
        this.subscription.card.card_mask = this.formatCardMask(this.subscription.card.card_mask);
      }, error: (error: any) => {
        this.toastService.error(error.message);
      }
    });

    if (this.subscription.id) return;

    this.checkoutService.getSubscriptionData().subscribe({
      next: (subscription: SubscriptionModel) => {
        this.subscription = subscription;
        if (this.subscription.card?.card_mask) {
          this.subscription.card.card_mask = this.formatCardMask(this.subscription.card.card_mask);
        }
      }, error: (error: any) => {
        this.toastService.error(error.message);
      }
    })
  }

  /**
   * Reprocessa um pagamento
   * @param paymentId - ID do pagamento
   * @param event - Evento do clique
   */
  retryPayment(paymentId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.loadingPayments.push(paymentId);

    this.checkoutService.retryCharge(paymentId).subscribe({
      next: (response: any) => {
        this.toastService.success('Pagamento reprocessado com sucesso');
        this.checkoutService.forceRefresh();
      }, error: (error: any) => {
        this.toastService.error(error.message);
        this.loadingPayments = this.loadingPayments.filter(id => id !== paymentId);
      }, complete: () => {
        this.loadingPayments = this.loadingPayments.filter(id => id !== paymentId);
      }
    });
  }

  /**
   * Paga um pagamento com cartão
   * @param paymentId - ID do pagamento
   * @param event - Evento do clique
   */
  payWithCard(paymentId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.loadingPayments.push(paymentId);

    this.checkoutService.payWithCard(paymentId).subscribe({
      next: (response: any) => {
        this.toastService.success('Pagamento realizado com sucesso');
        this.checkoutService.forceRefresh();
      }, error: (error: any) => {
        this.toastService.error(error.message);
        this.loadingPayments = this.loadingPayments.filter(id => id !== paymentId);
      }, complete: () => {
        this.loadingPayments = this.loadingPayments.filter(id => id !== paymentId);
      }
    });
  }

  /**
   * Verifica se um pagamento específico está carregando
   * @param paymentId - ID do pagamento
   * @returns true se estiver carregando
   */
  isPaymentLoading(paymentId: string): boolean {
    return this.loadingPayments.includes(paymentId);
  }

  /**
   * Sanitiza o status da fatura
   * @param status - The status
   * @returns The sanitized status
   */
  sanitizePaymentStatus(status: string): string {
    return this.efiService.sanitizePaymentStatus(status);
  }

  /**
   * 
   * @param planeName 
   * @returns 
   */
  sanitizeIcon(planeName: string): string {
    return this.utilsService.sanitizeIcon(planeName);
  }

  /**
   * Redireciona para a página de checkout
   */
  upgradeSubscription(): void {
    this.router.navigate(['/checkout']);
  }

  /**
   * Formata a máscara do cartão para exibir em grupos de 4 dígitos
   * @param cardMask - A máscara do cartão (ex: '1234XXXX5678XXXX')
   * @returns A máscara formatada (ex: '1234 XXXX 5678 XXXX')
   */
  private formatCardMask(cardMask: string): string {
    if (!cardMask) return '';
    
    // Formata em grupos de 4 caracteres separados por espaço
    // Preserva tanto números quanto letras X
    return cardMask.replace(/(.{4})(?=.)/g, '$1 ');
  }
}
