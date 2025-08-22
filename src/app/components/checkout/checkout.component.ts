import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { CurrencyPipe } from '@angular/common';

import { MatCard } from "@angular/material/card";
import { LucideAngularModule, Star } from "lucide-angular";
import { MatDialog } from '@angular/material/dialog';

import { PlanModel } from '../../models/plan.model';
import { CheckoutService } from '../../services/checkout.service';
import { ToastService } from '../../services/toast.service';
import { CheckoutFormComponent } from './checkout-form/checkout-form.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { UtilsService } from '../../services/utils/utils.service';

registerLocaleData(localePt);

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [MatCard, LucideAngularModule, CurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  providers: [{
    provide: LOCALE_ID, 
    useValue: "pt-BR"
  }],
})
export class CheckoutComponent implements OnInit {
  readonly starIcon = Star;

  plans: PlanModel[] = [];

  hotQuestions: { question: string, answer: string }[] = [
    { question: 'Posso mudar de plano a qualquer momento?', answer: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações são aplicadas no próximo ciclo de cobrança.' },
    { question: 'Existe período de fidelidade?', answer: 'Não! Todos os nossos planos são mensais e você pode cancelar a qualquer momento sem taxas adicionais ou multas.' },
    { question: 'Posso ter acesso aos dados do meu estoque?', answer: 'Sim, você pode ter acesso aos dados do seu estoque. Basta entrar em contato conosco e solicitar o acesso.' },
    { question: 'Preciso de treinamento?', answer: 'Nossa plataforma é intuitiva, mas oferecemos treinamento gratuito para todos os planos. O plano Ouro inclui treinamento personalizado.'}
  ];

  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly toastService: ToastService,
    private readonly dialog: MatDialog,
    private readonly breakpointObserver: BreakpointObserver,
    readonly utilsService: UtilsService
  ) { }

  ngOnInit(): void {
    this.fetchPlans();
  }

  /**
   * Busca os planos disponíveis
   */
  fetchPlans(): void {
    this.checkoutService.getPlans().subscribe({
      next: (data) => {
        this.plans = data;
        this.orderPlans();
      },
      error: (error) => {
        console.error(error);
        this.toastService.error(error.message || 'Erro ao buscar planos');
      }
    })
  }

  openCheckoutForm(plan: PlanModel): void {
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);

    this.dialog.open(CheckoutFormComponent, {
      panelClass: isMobile ? 'mobile-dialog' : 'modern-dialog',
      width: isMobile ? '95vw' : '800px',
      maxWidth: isMobile ? '95vw' : '800px',
      height: 'auto',
      data: { plan }
    });
  }

  /**
   * Ordena os planos de acordo com a ordem desejada
   */
  private orderPlans(): void {
    const orderMap = { 'Bronze': 1, 'Ouro': 2, 'Prata': 3 };

    let left = 0;
    let right = this.plans.length - 1;
    let current = 0;
    
    while (current <= right) {
      const currentPlan = this.plans[current];
      const currentOrder = orderMap[currentPlan.name as keyof typeof orderMap] || 999;
      
      if (currentOrder === 1) {
        this.swapPlans(left, current);
        left++;
        current++;
      } else if (currentOrder === 3) {
        this.swapPlans(current, right);
        right--;
      } else {
        current++;
      }
    }
  }
  
  /**
   * Troca os planos de posição
   * @param index1 - Índice do primeiro plano
   * @param index2 - Índice do segundo plano
   */
  private swapPlans(index1: number, index2: number): void {
    if (index1 !== index2) {
      const temp = this.plans[index1];
      this.plans[index1] = this.plans[index2];
      this.plans[index2] = temp;
    }
  }

  /**
   * Sanitiza o nome do plano para retornar o ícone correspondente
   * @param planName - Nome do plano
   * @returns Ícone correspondente ao plano
   */
  sanitizeIcon(planName: string): any {
    return this.utilsService.sanitizeIcon(planName);
  }
}
