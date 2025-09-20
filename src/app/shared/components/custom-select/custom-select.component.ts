import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full font-[Lora]" [class.opacity-60]="disabled">
      <div
        #selectTrigger
        class="flex items-center justify-between w-full min-h-[48px] px-4 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-300 shadow-sm"
        [class]="getTriggerClasses()"
        (click)="toggleDropdown()"
        (keydown)="onKeyDown($event)"
        tabindex="0"
        role="combobox"
        [attr.aria-expanded]="isOpen"
        [attr.aria-haspopup]="true"
        [attr.aria-label]="placeholder">
        
        <!-- Selected value or placeholder -->
        <span class="flex-1 text-sm font-medium text-gray-400 leading-6 whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-300">
          {{ selectedOption ? selectedOption.label : placeholder }}
        </span>
        
        <!-- Dropdown arrow -->
        <svg 
          class="flex-shrink-0 w-5 h-5 ml-2 text-gray-400 transition-all duration-300 custom-select-arrow"
          [class.rotated]="isOpen"
          [class.text-blue-400]="isOpen || isFocused"
          viewBox="0 0 20 20" 
          fill="none">
          <path 
            d="M5 7.5L10 12.5L15 7.5" 
            stroke="currentColor" 
            stroke-width="1.5" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>
        </svg>
      </div>
      
      <!-- Dropdown menu -->
      <div 
        #dropdownMenu
        class="absolute left-0 right-0 bg-white border-2 border-gray-200 shadow-lg z-50 max-h-48 overflow-hidden transition-all duration-300"
        [class]="getDropdownClasses()"
        role="listbox">
        
        <div class="max-h-48 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          @for (option of options; track option.value) {
            <div
              class="flex items-center px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer transition-all duration-200 relative mx-2 rounded-lg"
              [class]="getOptionClasses(option, $index)"
              (click)="selectOption(option)"
              (mouseenter)="hoveredIndex = $index"
              role="option"
              [attr.aria-selected]="isSelected(option)">
              {{ option.label }}
              
              <!-- Checkmark for selected option -->
              @if (isSelected(option)) {
                <span class="absolute right-4 text-white font-bold text-base checkmark-animation">✓</span>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./custom-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Selecione uma opção';
  @Input() disabled: boolean = false;
  @Input() searchable: boolean = false;
  @Input() clearable: boolean = false;
  @Input() maxHeight: string = '200px';

  @Output() selectionChange = new EventEmitter<SelectOption>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('selectTrigger', { static: true }) selectTrigger!: ElementRef;
  @ViewChild('dropdownMenu', { static: true }) dropdownMenu!: ElementRef;

  isOpen = false;
  isFocused = false;
  selectedOption: SelectOption | null = null;
  hoveredIndex = -1;
  dropdownAbove = false;

  private onChange = (value: any) => { };
  private onTouched = () => { };

  ngOnInit() {
    // Initialize selected option if value is set
    if (this.selectedOption) {
      this.updateSelectedOption();
    }
  }

  ngOnDestroy() {
    this.closeDropdown();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.isOpen) {
      this.positionDropdown();
    }
  }

  toggleDropdown() {
    if (this.disabled) return;

    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    if (this.disabled) return;

    this.isOpen = true;
    this.isFocused = true;
    this.hoveredIndex = this.getSelectedIndex();
    this.positionDropdown();
    this.opened.emit();
  }

  closeDropdown() {
    this.isOpen = false;
    this.isFocused = false;
    this.hoveredIndex = -1;
    this.onTouched();
    this.closed.emit();
  }

  selectOption(option: SelectOption) {
    if (option.disabled) return;

    this.selectedOption = option;
    this.isOpen = false;
    this.isFocused = false;
    this.hoveredIndex = -1;

    this.onChange(option.value);
    this.selectionChange.emit(option);
    this.onTouched();
  }

  isSelected(option: SelectOption): boolean {
    return this.selectedOption?.value === option.value;
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.isOpen) {
          if (this.hoveredIndex >= 0 && this.hoveredIndex < this.options.length) {
            this.selectOption(this.options[this.hoveredIndex]);
          }
        } else {
          this.openDropdown();
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen) {
          this.openDropdown();
        } else {
          this.hoveredIndex = Math.min(this.hoveredIndex + 1, this.options.length - 1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen) {
          this.openDropdown();
        } else {
          this.hoveredIndex = Math.max(this.hoveredIndex - 1, 0);
        }
        break;
    }
  }

  private getSelectedIndex(): number {
    if (!this.selectedOption) return -1;
    return this.options.findIndex(option => option.value === this.selectedOption?.value);
  }

  private updateSelectedOption() {
    if (this.selectedOption) {
      const option = this.options.find(opt => opt.value === this.selectedOption?.value);
      if (option) {
        this.selectedOption = option;
      }
    }
  }

  private positionDropdown() {
    if (!this.dropdownMenu) return;

    const trigger = this.selectTrigger.nativeElement;
    const dropdown = this.dropdownMenu.nativeElement;
    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Default max height

    // Check if there's enough space below
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    this.dropdownAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value !== null && value !== undefined) {
      const option = this.options.find(opt => opt.value === value);
      this.selectedOption = option || null;
    } else {
      this.selectedOption = null;
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  constructor(private elementRef: ElementRef) { }

  getTriggerClasses(): string {
    let classes = '';

    if (!this.disabled) {
      if (this.isOpen || this.isFocused) {
        classes += ' border-blue-400 ring-2 ring-blue-400 ring-opacity-20';
      } else {
        classes += ' hover:border-blue-400 hover:shadow-md';
      }
    } else {
      classes += ' bg-gray-50 border-gray-300 cursor-not-allowed';
    }

    if (this.isOpen) {
      classes += ' rounded-b-none';
    }

    return classes;
  }

  getDropdownClasses(): string {
    let classes = '';

    if (this.isOpen) {
      classes += ' opacity-100 visible translate-y-0';
    } else {
      classes += ' opacity-0 invisible -translate-y-2';
    }

    if (this.dropdownAbove) {
      classes += ' bottom-full top-auto border-t-2 border-b-0 rounded-t-xl rounded-b-none';
    } else {
      classes += ' top-full border-t-0 border-b-2 rounded-b-xl rounded-t-none';
    }

    return classes;
  }

  getOptionClasses(option: SelectOption, index: number): string {
    let classes = '';

    if (option.disabled) {
      classes += ' opacity-60 cursor-not-allowed';
    } else if (this.isSelected(option)) {
      classes += ' bg-gray-800 text-white font-semibold shadow-sm hover:bg-gray-700 transform translate-x-1';
    } else if (this.hoveredIndex === index) {
      classes += ' bg-gray-800 text-white transform translate-x-1';
    } else {
      classes += ' hover:bg-gray-800 hover:text-white hover:transform hover:translate-x-1';
    }

    return classes;
  }
}
