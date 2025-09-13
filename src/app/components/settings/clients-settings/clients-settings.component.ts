import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clients-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="text-center py-8">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Configurações de Clientes</h3>
        <p class="text-gray-600">Gerencie suas configurações de clientes aqui</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Perfis</h4>
          <p class="text-sm text-gray-600">Configure perfis de clientes</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Endereços</h4>
          <p class="text-sm text-gray-600">Configurações de endereços de entrega</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Comunicação</h4>
          <p class="text-sm text-gray-600">Preferências de comunicação</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Histórico</h4>
          <p class="text-sm text-gray-600">Configurações de histórico de compras</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ClientsSettingsComponent {
  constructor() { }
}