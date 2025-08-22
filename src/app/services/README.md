# CardBrandService

Serviço para gerenciar ícones de bandeiras de cartão de crédito/débito.

## Funcionalidades

- Mapeamento automático de nomes de bandeiras para SVGs
- Suporte para as principais bandeiras: Visa, Mastercard, American Express, Elo, Discover
- Fallback para bandeiras não reconhecidas
- SVGs otimizados e responsivos

## Uso

### 1. Injetar o serviço

```typescript
import { CardBrandService } from './services/card-brand.service';

constructor(private cardBrandService: CardBrandService) {}
```

### 2. Obter SVG de uma bandeira

```typescript
// Retorna o SVG da bandeira ou o padrão se não encontrada
const svgString = this.cardBrandService.getCardBrandSvg('visa');
```

### 3. Verificar se uma bandeira é suportada

```typescript
const isSupported = this.cardBrandService.isBrandSupported('mastercard');
```

### 4. Obter todas as bandeiras disponíveis

```typescript
const brands = this.cardBrandService.getAvailableBrands();
```

## Componente CardBrandIcon

Componente reutilizável para exibir as bandeiras de cartão.

### Uso no template

```html
<app-card-brand-icon 
  [brand]="'visa'" 
  width="40px" 
  height="25px"
  cssClasses="w-10 h-10">
</app-card-brand-icon>
```

### Propriedades

- `brand`: Nome da bandeira (string)
- `width`: Largura do ícone (string, padrão: '40px')
- `height`: Altura do ícone (string, padrão: '25px')
- `cssClasses`: Classes CSS adicionais (string)

## Bandeiras Suportadas

- **visa**: Visa
- **mastercard**: Mastercard
- **amex/americanexpress**: American Express
- **elo**: Elo
- **discover**: Discover
- **jcb**: JCB
- **diners**: Diners Club

## Exemplo Completo

```typescript
import { Component } from '@angular/core';
import { CardBrandIconComponent } from '../shared/components';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CardBrandIconComponent],
  template: `
    <div class="card-brands">
      <app-card-brand-icon brand="visa" width="60px" height="40px"></app-card-brand-icon>
      <app-card-brand-icon brand="mastercard" width="60px" height="40px"></app-card-brand-icon>
      <app-card-brand-icon brand="amex" width="60px" height="40px"></app-card-brand-icon>
    </div>
  `
})
export class ExampleComponent {}
```

## Vantagens

- ✅ Sem dependências externas
- ✅ SVGs otimizados e leves
- ✅ Fácil de customizar
- ✅ Suporte a múltiplas bandeiras
- ✅ Fallback automático
- ✅ Componente reutilizável
- ✅ Compatível com Angular standalone

