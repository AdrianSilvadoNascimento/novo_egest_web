import { Component, Input, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardBrandService } from '../../../services/card-brand.service';

@Component({
  selector: 'app-card-brand-icon',
  standalone: true,
  template: `
    <div 
      [innerHTML]="cardBrandSvg" 
      [class]="cssClasses"
      [style.width]="width"
      [style.height]="height">
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class CardBrandIconComponent {
  @Input() brand: string = '';
  @Input() width: string = '40px';
  @Input() height: string = '25px';
  @Input() cssClasses: string = '';

  cardBrandSvg: SafeHtml = '';

  constructor(
    private cardBrandService: CardBrandService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.updateCardBrandSvg();
  }

  ngOnChanges() {
    this.updateCardBrandSvg();
  }

  private updateCardBrandSvg() {
    const svgString = this.cardBrandService.getCardBrandSvg(this.brand);
    this.cardBrandSvg = this.sanitizer.bypassSecurityTrustHtml(svgString);
  }
}
