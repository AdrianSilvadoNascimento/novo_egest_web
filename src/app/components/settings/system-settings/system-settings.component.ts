import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="text-center py-8">
        <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Configurações do Sistema</h3>
        <p class="text-gray-600">Gerencie as configurações gerais do sistema aqui</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Geral</h4>
          <p class="text-sm text-gray-600">Configurações gerais do sistema</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Backup</h4>
          <p class="text-sm text-gray-600">Configurações de backup automático</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Logs</h4>
          <p class="text-sm text-gray-600">Configurações de logs do sistema</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Manutenção</h4>
          <p class="text-sm text-gray-600">Ferramentas de manutenção</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SystemSettingsComponent {
  constructor() { }
}