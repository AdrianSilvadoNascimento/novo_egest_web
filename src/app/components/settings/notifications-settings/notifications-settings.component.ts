import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="text-center py-8">
        <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4.828 17l2.586-2.586a2 2 0 012.828 0L12.828 17H4.828z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Configurações de Notificações</h3>
        <p class="text-gray-600">Gerencie suas preferências de notificações aqui</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Email</h4>
          <p class="text-sm text-gray-600">Configurações de notificações por email</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Push</h4>
          <p class="text-sm text-gray-600">Notificações push no navegador</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">SMS</h4>
          <p class="text-sm text-gray-600">Configurações de notificações por SMS</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Frequência</h4>
          <p class="text-sm text-gray-600">Defina a frequência das notificações</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class NotificationsSettingsComponent {
  constructor() { }
}