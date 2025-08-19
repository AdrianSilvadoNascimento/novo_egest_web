import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

import {
  Search,
  Funnel,
  RotateCcw,
  Package,
  User,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Repeat,
  Settings,
  LucideAngularModule
} from "lucide-angular";
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatIcon } from "@angular/material/icon";
import { MatCard } from "@angular/material/card";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDrawerContainer } from "@angular/material/sidenav";
import { MatSelect, MatSelectModule } from "@angular/material/select";
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { MovementationModel, PaginatedMovementationModel, MovementationFilters, MovementationType } from '../../models/movementation.model';
import { MovementationService } from '../../services/movementation.service';
import { ToastService } from '../../services/toast.service';
import { EmptyListComponent } from "../../shared/components/empty-list/empty-list.component";
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-movementation',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatIcon,
    MatCard,
    MatFormField,
    MatLabel,
    FormsModule,
    MatTooltipModule,
    MatDrawerContainer,
    MatSelect,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    InfiniteScrollDirective,
    EmptyListComponent,
    MatProgressBar,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './movementation.component.html',
  styleUrl: './movementation.component.scss'
})
export class MovementationComponent implements OnInit {
  readonly searchIcon = Search;
  readonly filterIcon = Funnel;
  readonly revertIcon = RotateCcw;
  readonly packageIcon = Package;
  readonly userIcon = User;
  readonly calendarIcon = Calendar;
  readonly fileTextIcon = FileText;
  readonly dollarSignIcon = DollarSign;
  
  // Ícones para tipos de movimentação
  readonly trendingUpIcon = TrendingUp;
  readonly trendingDownIcon = TrendingDown;
  readonly shoppingCartIcon = ShoppingCart;
  readonly repeatIcon = Repeat;
  readonly settingsIcon = Settings;

  @ViewChild('movementationsTable', { static: true }) movementationsTable!: ElementRef;
  
  searchTerm: string = '';
  sortBy: { html: string, value: string }[] = [
    { html: 'Data (Mais recente)', value: 'created_at_desc' },
    { html: 'Data (Mais antigo)', value: 'created_at_asc' },
    { html: 'Produto', value: 'item_name' },
    { html: 'Tipo', value: 'move_type' },
    { html: 'Usuário', value: 'user_name' },
    { html: 'Valor', value: 'total_value' }
  ];

  pageSize = 10;
  isEmpty: boolean = true;

  paginatedItems: PaginatedMovementationModel = {} as PaginatedMovementationModel;
  totalMovementations: number = 0;

  hasNext: boolean = false;
  loading: boolean = false;
  isSearching: boolean = false;
  nextCursor!: string;

  selectedSortBy: string = 'created_at_desc';
  filteredMovementations: MovementationModel[] = [];

  // Filtros
  filters: MovementationFilters = {};
  movementationTypes: string[] = [];
  showFilters: boolean = false;

  constructor(
    private dialog: MatDialog,
    private movementationService: MovementationService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.loadMovementationTypes();
  }

  /**
   * Carrega os dados iniciais das movimentações
   */
  private loadInitialData(): void {
    this.movementationService.getPaginated('', this.pageSize, this.filters).subscribe({
      next: (data) => {
        this.paginatedItems = data;
        this.isEmpty = data.data?.length === 0;
        this.hasNext = !!data.nextCursor;
        this.filteredMovementations = [...(data.data || [])];
        this.totalMovementations = data.totalRecords;
        this.sortCurrentData();
      },
      error: (err) => this.toast.error(err.error?.message || err.message)
    });
  }

  /**
   * Carrega os tipos de movimentação disponíveis
   */
  private loadMovementationTypes(): void {
    this.movementationService.getMovementationTypes().subscribe({
      next: (types) => {
        this.movementationTypes = types;
      },
      error: (err) => console.error('Erro ao carregar tipos:', err)
    });
  }

  /**
   * Carrega mais dados quando o usuário chega ao final da lista
   */
  loadMore(): void {
    if (this.loading || !this.hasNext) return;
    
    this.loading = true;
    this.movementationService.getPaginated(this.paginatedItems.nextCursor || '', this.pageSize, this.filters).subscribe({
      next: (data) => {
        this.paginatedItems.data = [...this.paginatedItems.data, ...data.data];
        this.paginatedItems.nextCursor = data.nextCursor;
        this.hasNext = !!data.nextCursor;
        this.filteredMovementations = [...this.paginatedItems.data];
        this.sortCurrentData();
        this.loading = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || err.message);
        this.loading = false;
      }
    });
  }

  /**
   * Manipula mudanças no campo de busca
   */
  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.debounceSearch();
  }

  private searchTimeout: any;
  private debounceSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  /**
   * Limpa o campo de busca
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  /**
   * Aplica os filtros e busca
   */
  applyFilters(): void {
    this.isSearching = true;
    const searchFilters = {
      ...this.filters,
      search: this.searchTerm.trim() || undefined
    };

    this.movementationService.getPaginated('', this.pageSize, searchFilters).subscribe({
      next: (data) => {
        this.paginatedItems = data;
        this.isEmpty = data.data?.length === 0;
        this.hasNext = !!data.nextCursor;
        this.filteredMovementations = [...(data.data || [])];
        this.totalMovementations = data.totalRecords;
        this.sortCurrentData();
        this.isSearching = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || err.message);
        this.isSearching = false;
      }
    });
  }

  /**
   * Manipula mudanças na ordenação
   */
  onSortChange(value: string): void {
    this.selectedSortBy = value;
    this.sortCurrentData();
  }

  /**
   * Ordena os dados atuais
   */
  private sortCurrentData(): void {
    switch (this.selectedSortBy) {
      case 'created_at_desc':
        this.filteredMovementations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'created_at_asc':
        this.filteredMovementations.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'item_name':
        this.filteredMovementations.sort((a, b) => (a.item?.name || '').localeCompare(b.item?.name || ''));
        break;
      case 'move_type':
        this.filteredMovementations.sort((a, b) => a.move_type.localeCompare(b.move_type));
        break;
      case 'user_name':
        this.filteredMovementations.sort((a, b) => (a.account_user?.name || '').localeCompare(b.account_user?.name || ''));
        break;
      case 'total_value':
        this.filteredMovementations.sort((a, b) => (b.total_value || 0) - (a.total_value || 0));
        break;
    }
  }

  /**
   * Alterna a exibição dos filtros
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Limpa todos os filtros
   */
  clearFilters(): void {
    this.filters = {};
    this.searchTerm = '';
    this.applyFilters();
  }

  /**
   * Reverte uma movimentação
   */
  revertMovementation(movementation: MovementationModel, event: Event): void {
    event.stopPropagation();
    
    const oppositeType = this.movementationService.getOppositeMovementType(movementation.move_type);
    const actionText = movementation.move_type === MovementationType.ENTRADA ? 'reverter a entrada' : 'reverter a saída';
    
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      panelClass: 'confirmation-dialog',
      data: {
        title: 'Reverter Movimentação',
        message: `Deseja ${actionText} de ${movementation.quantity} unidades do produto "${movementation.item?.name}"? Esta ação criará uma nova movimentação do tipo ${this.movementationService.getMovementTypeLabel(oppositeType)}.`,
        confirmText: 'Reverter',
        cancelText: 'Cancelar',
        confirmColor: 'red' as const,
        icon: this.revertIcon
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performRevert(movementation.id);
      }
    });
  }

  /**
   * Executa a reversão da movimentação
   */
  private performRevert(movementationId: string): void {
    this.movementationService.revertMovementation(movementationId).subscribe({
      next: () => {
        this.toast.success('Movimentação revertida com sucesso!');
        this.loadInitialData(); // Recarrega a lista
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Erro ao reverter movimentação');
      }
    });
  }

  /**
   * Obtém a cor do badge para o tipo de movimentação
   */
  getMovementTypeColor(type: string): string {
    return this.movementationService.getMovementTypeColor(type);
  }

  /**
   * Obtém o label amigável para o tipo de movimentação
   */
  getMovementTypeLabel(type: string): string {
    return this.movementationService.getMovementTypeLabel(type);
  }

  /**
   * Obtém o ícone para o tipo de movimentação
   */
  getMovementTypeIcon(type: string): any {
    const iconName = this.movementationService.getMovementTypeIcon(type);
    switch (iconName) {
      case 'trending-up':
        return this.trendingUpIcon;
      case 'trending-down':
        return this.trendingDownIcon;
      case 'shopping-cart':
        return this.shoppingCartIcon;
      case 'repeat':
        return this.repeatIcon;
      case 'settings':
        return this.settingsIcon;
      default:
        return this.packageIcon;
    }
  }

  /**
   * Obtém o sinal para a quantidade (+/-)
   */
  getQuantitySign(type: string): string {
    return [MovementationType.ENTRADA, MovementationType.AJUSTE].includes(type as MovementationType) ? '+' : '-';
  }

  /**
   * Formata o nome completo do usuário
   */
  getUserFullName(movementation: MovementationModel): string {
    if (!movementation.account_user || !movementation.account_user.name) return 'Sistema';
    return `${movementation.account_user.name} ${movementation.account_user.lastname || ''}`.trim();
  }

  /**
   * Verifica se uma movimentação pode ser revertida
   */
  canRevertMovementation(movementation: MovementationModel): boolean {
    // Lógica para determinar se pode ser revertida
    // Por exemplo, não permitir reverter movimentações muito antigas
    // ou que já foram revertidas
    return true; // Por enquanto, permite reverter todas
  }
}
