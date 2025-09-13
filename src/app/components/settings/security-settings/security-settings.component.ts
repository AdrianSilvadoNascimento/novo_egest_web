import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="text-center py-8">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Configurações de Segurança</h3>
        <p class="text-gray-600">Gerencie suas configurações de segurança aqui</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Senha</h4>
          <p class="text-sm text-gray-600">Altere sua senha de acesso</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">2FA</h4>
          <p class="text-sm text-gray-600">Configurações de autenticação em duas etapas</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Sessões</h4>
          <p class="text-sm text-gray-600">Gerencie sessões ativas</p>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-2">Privacidade</h4>
          <p class="text-sm text-gray-600">Configurações de privacidade</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SecuritySettingsComponent {
  constructor() { }
}