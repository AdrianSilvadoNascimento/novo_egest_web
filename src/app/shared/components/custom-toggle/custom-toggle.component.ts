import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-custom-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-toggle" 
         [class.checked]="checked" 
         [class.disabled]="disabled"
         (click)="toggle()"
         [attr.aria-checked]="checked"
         [attr.aria-disabled]="disabled"
         role="switch"
         tabindex="0"
         (keydown.space)="toggle()"
         (keydown.enter)="toggle()">
      
      <div class="toggle-track">
        <div class="toggle-thumb"></div>
      </div>
    </div>
  `,
  styles: [`
    .custom-toggle {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
      cursor: pointer;
      user-select: none;
      transition: all 0.3s ease;
    }

    .custom-toggle.disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .toggle-track {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #e5e7eb;
      border-radius: 12px;
      transition: background-color 0.3s ease;
      border: 2px solid #e5e7eb;
    }

    .toggle-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background-color: #9ca3af;
      border-radius: 50%;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .custom-toggle.checked .toggle-track {
      background-color: #2a5f9a;
      border-color: #2a5f9a;
    }

    .custom-toggle.checked .toggle-thumb {
      background-color: #3377bc;
      transform: translateX(26px);
    }

    .custom-toggle:hover:not(.disabled) .toggle-thumb {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .custom-toggle:focus {
      outline: none;
    }

    .custom-toggle:focus .toggle-thumb {
      box-shadow: 0 0 0 3px rgba(51, 119, 188, 0.2);
    }

    .custom-toggle.disabled .toggle-track {
      background-color: #f3f4f6;
      border-color: #d1d5db;
    }

    .custom-toggle.disabled .toggle-thumb {
      background-color: #d1d5db;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomToggleComponent),
      multi: true
    }
  ]
})
export class CustomToggleComponent implements ControlValueAccessor {
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  toggle() {
    if (!this.disabled) {
      this.checked = !this.checked;
      this.checkedChange.emit(this.checked);
      this.onChange(this.checked);
      this.onTouched();
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.checked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
