import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { CircleUserRound, LogOut, LucideAngularModule, ChevronDown, PanelLeft, Wallet } from 'lucide-angular';

import { AuthService } from '../../services/auth.service';
import { SidenavService } from '../../services/sidenav.service';
import { AccountModel } from '../../models/account.model';
import { AccountService } from '../../services/account.service';
import { TrialUtilsService } from '../../services/utils/trial-utils.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, LucideAngularModule, MatMenuModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  readonly logOutIcon = LogOut;
  readonly userIcon = CircleUserRound
  readonly chevronDownIcon = ChevronDown;
  readonly menuIcon = PanelLeft;
  readonly financialIcon = Wallet;

  @Output() toggleSidenav = new EventEmitter<void>()

  userName!: string;
  userImage!: string;
  isLogged: boolean = false;
  account: AccountModel = new AccountModel();
  ctaMessage: string = '';

  constructor(
    readonly authService: AuthService,
    readonly sidenavService: SidenavService,
    readonly accountService: AccountService,
    readonly router: Router,
    readonly trialUtils: TrialUtilsService
  ) { }

  ngOnInit(): void {
    this.authService.$toggleLogin.subscribe((isLogged) => {
      this.isLogged = isLogged
      this.getUserImage()
      
      if (isLogged) {
        this.getAccount();
        this.toggleSidenav.emit()
      }
    })

    this.authService.$userName.subscribe((userName) => {
      this.userName = userName || 'Fulano'
    })
  }

  /**
   * Getter que calcula dinamicamente a mensagem do trial
   * Sempre retorna o valor correto baseado no estado atual da conta
   */
  get trialDaysMessage(): string {
    if (!this.account?.created_at) {
      return 'Carregando...';
    }
    
    const daysRemaining = this.calculateTrialDays();
    const daysMessage = daysRemaining === 1 ? 'dia' : 'dias';
    
    if (daysRemaining <= 0) {
      return 'Seu teste grátis expirou';
    } else {
      return `Seu teste grátis termina em ${daysRemaining} ${daysMessage}`;
    }
  }

  /**
   * Obtém o usuário
   */
  getAccount(): void {
    this.accountService.$accountData.subscribe((account: AccountModel) => {
      this.account = account;
    })
  }

  /**
   * Calcula o número de dias restantes do teste grátis
   * @returns O número de dias restantes
   */
  calculateTrialDays(): number {
    return this.trialUtils.calculateTrialDays(this.account.created_at);
  }

  /**
   * Obtém a imagem do usuário
   */
  getUserImage(): void {
    const remeberMe = this.authService.rememberMe();

    this.userImage = remeberMe ? localStorage.getItem('user_image') || '' : sessionStorage.getItem('user_image') || '';
  }

  /**
   * Realiza o logout do usuário
   */
  logout(): void {
    this.authService.logout()
    this.toggleSidenav.emit();
  }

  /**
   * Mostra os planos
   */
  showPlans(): void {
    this.router.navigate(['/checkout']);
  }
}
