import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

import { Funnel, LayoutGrid, FileUp, List, LucideAngularModule, UserPlus, Search, User, Phone, MapPin, Mail, Building2, CheckCircle, X } from "lucide-angular";
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

import { CustomerModel } from '../../models/customer.model';
import { PaginatedCustomersModel } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { ToastService } from '../../services/toast.service';
import { EmptyListComponent } from "../../shared/components/empty-list/empty-list.component";
import { CustomerDetailsComponent } from './customer-details/customer-details.component';
import { CustomerFormComponent } from './customer-form/customer-form.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-customer',
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
    InfiniteScrollDirective,
    EmptyListComponent,
    MatProgressBar,
    CurrencyPipe,
    DatePipe
],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss'
})
export class CustomerComponent implements OnInit {
  readonly addIcon = UserPlus;
  readonly importIcon = FileUp;
  readonly searchIcon = Search;
  readonly filterIcon = Funnel;
  readonly cardIcon = LayoutGrid;
  readonly listIcon = List;
  readonly userIcon = User;
  readonly businessIcon = Building2;
  readonly mailIcon = Mail;
  readonly phoneIcon = Phone;
  readonly mapPinIcon = MapPin;

  @ViewChild('customersTable', { static: true }) customersTable!: ElementRef;
  
  searchTerm: string = '';
  viewMode: { card: boolean, list: boolean } = { card: true, list: false };
  sortBy: { html: string, value: string }[] = [
    { html: 'Nome', value: 'name' },
    { html: 'Email', value: 'email' },
    { html: 'Documento', value: 'document' }
  ]

  pageSize = 10;
  isEmpty: boolean = true;

  paginatedItems: PaginatedCustomersModel = new PaginatedCustomersModel();
  totalCustomers: number = 0;

  hasNext: boolean = false;
  loading: boolean = false;
  isSearching: boolean = false;
  nextCursor!: string;

  selectedSortBy: string = 'name';
  selectedSortOrder: string = 'desc';
  filteredCustomers: CustomerModel[] = [];

  editedCustomer!: CustomerModel;

  constructor(
    private dialog: MatDialog,
    private customerService: CustomerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  /**
   * Alterna o modo de visualização entre card e list
   * @param mode - 'card' ou 'list'
   */
  toggleViewMode(mode: 'card' | 'list'): void {
    this.viewMode.card = false;
    this.viewMode.list = false;

    this.viewMode[mode] = true;

    if (this.searchTerm.trim()) {
      this.filterCustomers();
    }
  }

  /**
   * Filtra os clientes com base no termo de busca
   */
  private filterCustomers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCustomers = [...(this.paginatedItems.data || [])];
      return;
    }

    const searchTerm = this.searchTerm.toLowerCase();
    this.filteredCustomers = this.paginatedItems.data.filter(customer => 
      customer.name?.toLowerCase().includes(searchTerm) ||
      customer.lastname?.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm) ||
      customer.document?.toLowerCase().includes(searchTerm)
    );

    this.sortFiltered();
  }

  /**
   * Limpa o termo de busca e restaura a lista completa
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.filteredCustomers = [...(this.paginatedItems.data || [])];
  }

  /**
   * Atualiza o termo de busca e realiza a busca no backend
   * @param term - Termo de busca
   */
  onSearchChange(term: string): void {
    this.searchTerm = term;
    if (!term.trim()) {
      this.filteredCustomers = [...(this.paginatedItems.data || [])];
      return;
    }
    this.performBackendSearch(term);
  }

  /**
   * Alterna a ordenação dos dados
   * @param sortBy - Campo de ordenação
   */
  onSortChange(sortBy: string): void {
    this.selectedSortBy = sortBy;
    this.selectedSortOrder = 'asc';
    this.sortCurrentData();

    if (this.filteredCustomers.length > 0) {
      this.sortFiltered();
    }
  }

  /**
   * Lida com o evento de seleção de arquivo de importação
   * @param $event - Evento de seleção de arquivo
   */
  onFileImportSelected($event: Event): void {
    const input = $event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      console.log(file);
    }
  }

  /**
   * Carrega os dados iniciais do cliente
   */
  private loadInitialData(): void {
    this.customerService.getPaginated('', this.pageSize).subscribe({
      next: (data) => {
        this.paginatedItems = data;
        this.isEmpty = data.data?.length === 0;
        this.hasNext = !!data.nextCursor;
        this.filteredCustomers = [...(data.data || [])];
        this.totalCustomers = data.totalRecords;
        this.sortCurrentData();
      },
      error: (err) => this.toast.error(err.error?.message || err.message)
    });
  }

  /**
   * Carrega mais dados quando o usuário chega ao final da lista
   */
  loadMore(): void {
    if (this.loading || !this.hasNext) return;
    this.loading = true;
    const cursor = this.paginatedItems.nextCursor || '';
    this.customerService.getPaginated(cursor, this.pageSize, undefined, this.searchTerm).subscribe({
      next: (data) => {
        this.loading = false;
        this.hasNext = !!data.nextCursor;
        this.paginatedItems.data = [...(this.paginatedItems.data || []), ...data.data];
        this.paginatedItems.nextCursor = data.nextCursor;
        this.sortCurrentData();
        this.filteredCustomers = [...(this.paginatedItems.data || [])];
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || err.message);
      }
    });
  }

  /**
   * Realiza a busca no backend com o termo de busca
   * @param term - Termo de busca
   */
  private performBackendSearch(term: string): void {
    this.customerService.search(term, 100).subscribe({
      next: (results) => {
        const all = [...(this.paginatedItems.data || [])];
        results.forEach(c => { if (!all.some(x => x.id === c.id)) all.push(c); });
        this.filteredCustomers = all.filter(c =>
          c.name?.toLowerCase().includes(term.toLowerCase()) ||
          c.lastname?.toLowerCase().includes(term.toLowerCase()) ||
          c.email?.toLowerCase().includes(term.toLowerCase()) ||
          c.document?.toLowerCase().includes(term.toLowerCase())
        );

        this.sortFiltered();
      },
      error: () => {}
    });
  }

  /**
   * Ordena os dados atuais
   */
  private sortCurrentData(): void {
    if (!this.paginatedItems.data?.length) return;
    this.paginatedItems.data = this.sortArray(this.paginatedItems.data, this.selectedSortBy, this.selectedSortOrder);
  }

  /**
   * Ordena os dados filtrados
   */
  private sortFiltered(): void {
    if (!this.filteredCustomers.length) return;
    this.filteredCustomers = this.sortArray(this.filteredCustomers, this.selectedSortBy, this.selectedSortOrder);
  }

  /**
   * Ordena um array de acordo com o campo e ordem de ordenação
   * @param array - Array a ser ordenado
   * @param sortBy - Campo de ordenação
   * @param sortOrder - Ordem de ordenação
   * @returns Array ordenado
   */
  private sortArray<T>(array: T[], sortBy: string, sortOrder: string): T[] {
    return [...array].sort((a: any, b: any) => {
      let A: any, B: any;
      switch (sortBy) {
        case 'name': A = a.name?.toLowerCase() || ''; B = b.name?.toLowerCase() || ''; break;
        case 'email': A = a.email?.toLowerCase() || ''; B = b.email?.toLowerCase() || ''; break;
        case 'document': A = a.document?.toLowerCase() || ''; B = b.document?.toLowerCase() || ''; break;
        default: return 0;
      }
      const cmp = A > B ? 1 : (A < B ? -1 : 0);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }

  /**
   * Abre o modal de detalhes do cliente
   * @param customer - Cliente a ser exibido
   */
  openCustomerDetails(customer: CustomerModel): void {
    this.editedCustomer = customer;

    const dialogRef = this.dialog.open(CustomerDetailsComponent, {
      data: this.editedCustomer,
      panelClass: 'modern-dialog',
      minWidth: '800px'
    })

    dialogRef.afterClosed().subscribe(customerDetails => {
      if (!customerDetails) return;

      this.paginatedItems.data = this.paginatedItems.data
        .map((item: CustomerModel) => item.id === customerDetails.id ? customerDetails : item);

      this.sortCurrentData();

      if (this.searchTerm.trim()) {
        this.filterCustomers();
      } else {
        this.filteredCustomers = [...this.paginatedItems.data];
      }
    })
  }

  /**
   * Recarrega a lista de clientes
   */
  loadCustomers(): void {
    this.customerService.$customerData.subscribe({
      next: (customerData: PaginatedCustomersModel) => {
        this.paginatedItems = customerData;
        this.isEmpty = !customerData.data?.length;

        if (this.searchTerm.trim()) {
          this.filterCustomers();
          return;
        }

        this.filteredCustomers = [...this.paginatedItems.data];
      },
      error: (error) => {
        this.toast.error(error.messag);
      }
    })
  }

  /**
   * Abre modal para adicionar novo cliente
   */
  onAddCustomer(): void {
    const dialogRef = this.dialog.open(CustomerFormComponent, {
      minWidth: '900px',
      data: {
        customer: new CustomerModel(),
        isEdit: false,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        if (!sessionStorage.getItem('customer_form_draft')) {
          sessionStorage.removeItem('customer_form_draft');
        }

        return;
      }
      
      this.clearSearch();
      this.loadCustomers();
    });
  }

  /**
   * Abre modal para editar cliente
   * @param customer - qual o cliente será atualizado
   */
  onEditCustomer(customer: CustomerModel): void {
    const dialogRef = this.dialog.open(CustomerFormComponent, {
      minWidth: '900px',
      data: {
        customer,
        isEdit: true,
      }
    })

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        if (!sessionStorage.getItem('customer_form_draft')) {
          sessionStorage.removeItem('customer_form_draft');
        }

        return;
      }

      this.editedCustomer = result;
      this.clearSearch();
      this.loadCustomers();
    })
  }

  /**
   * Deleta cliente
   * @param customerId - id do cliente a ser deletado
   */
  onDeleteCustomer(customerId: string): void {
    this.customerService.delete(customerId).subscribe({
      next: () => {
        this.clearSearch();
        this.loadCustomers();
      },
      error: (err) => this.toast.error(err.error?.message || err.message)
    })
  }

  /**
   * Alterna o status ativo/inativo do cliente
   * @param customer - cliente a ter o status alterado
   * @param event - evento do clique (para evitar propagação)
   */
  toggleCustomerStatus(customer: CustomerModel, event: Event): void {
    // Evitar que o clique abra os detalhes do cliente
    event.stopPropagation();
    
    const newStatus = !customer.active;
    const statusText = newStatus ? 'ativar' : 'desativar';
    const icon = newStatus ? CheckCircle : X;
    const confirmColor = newStatus ? 'green' : 'red';
    
    // Abrir dialog de confirmação
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'confirmation-dialog',
      data: {
        title: `${newStatus ? 'Ativar' : 'Desativar'} Cliente`,
        message: `Tem certeza que deseja ${statusText} o cliente "${customer.name}"?`,
        confirmText: newStatus ? 'Ativar' : 'Desativar',
        cancelText: 'Cancelar',
        confirmColor: confirmColor,
        icon: icon
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      // Se está ativando um cliente inativo, usar rota de reativação
      if (newStatus && !customer.active) {
        this.reactivateCustomer(customer);
      } else {
        // Para desativar ou outros casos, usar rota de status
        this.updateCustomerStatus(customer, newStatus);
      }
    });
  }

  /**
   * Atualiza o status do cliente via rota /status
   * @param customer - cliente a ser atualizado
   * @param newStatus - novo status
   */
  private updateCustomerStatus(customer: CustomerModel, newStatus: boolean): void {
    this.customerService.updateStatus(customer.id, newStatus).subscribe({
      next: (updatedCustomer: CustomerModel) => {
        this.updateCustomerInLists(customer.id, newStatus);
        this.toast.success(`Cliente ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      },
      error: (error) => {
        this.toast.error('Erro ao alterar status do cliente: ' + (error.error?.message || error.message));
      }
    });
  }

  /**
   * Reativa um cliente via rota /reactivate
   * @param customer - cliente a ser reativado
   */
  private reactivateCustomer(customer: CustomerModel): void {
    this.customerService.reactivate(customer.id).subscribe({
      next: (response) => {
        this.updateCustomerInLists(customer.id, true);
        this.toast.success(response.message || 'Cliente reativado com sucesso!');
      },
      error: (error) => {
        this.toast.error('Erro ao reativar cliente: ' + (error.error?.message || error.message));
      }
    });
  }

  /**
   * Atualiza o cliente nas listas locais
   * @param customerId - ID do cliente
   * @param newStatus - novo status
   */
  private updateCustomerInLists(customerId: string, newStatus: boolean): void {
    // Atualizar o cliente na lista filtrada
    const index = this.filteredCustomers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      this.filteredCustomers[index] = { ...this.filteredCustomers[index], active: newStatus };
    }
    
    // Também atualizar na lista principal se existir
    if (this.paginatedItems?.data) {
      const mainIndex = this.paginatedItems.data.findIndex(c => c.id === customerId);
      if (mainIndex !== -1) {
        this.paginatedItems.data[mainIndex] = { ...this.paginatedItems.data[mainIndex], active: newStatus };
      }
    }
  }
}
