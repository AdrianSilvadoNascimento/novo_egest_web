import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidenavService {
  private _expanded = new BehaviorSubject<boolean>(false);
  private _isMobile = new BehaviorSubject<boolean>(false);
  private _mode = new BehaviorSubject<'side' | 'over'>('side');
  private _opened = new BehaviorSubject<boolean>(true);

  public expanded$ = this._expanded.asObservable();
  public isMobile$ = this._isMobile.asObservable();
  public mode$ = this._mode.asObservable();
  public opened$ = this._opened.asObservable();

  constructor() { }

  /**
   * Alterna o estado expandido/colapsado do sidenav
   */
  toggle(): void {
    const isMobile = this._isMobile.value;
    
    if (isMobile) {
      this._opened.next(!this._opened.value);
      if (this._opened.value) {
        this._expanded.next(true);
      }
    } else {
      this._expanded.next(!this._expanded.value);
    }
  }

  /**
   * Define o estado expandido do sidenav
   * @param expanded - true para expandido, false para colapsado
   */
  setExpanded(expanded: boolean): void {
    this._expanded.next(expanded);
  }

  /**
   * Define se está em modo mobile
   * @param isMobile - true para mobile, false para desktop
   */
  setMobile(isMobile: boolean): void {
    this._isMobile.next(isMobile);
  }

  /**
   * Define o modo do sidenav
   * @param mode - 'side' ou 'over'
   */
  setMode(mode: 'side' | 'over'): void {
    this._mode.next(mode);
  }

  /**
   * Define se o sidenav está aberto
   * @param opened - true para aberto, false para fechado
   */
  setOpened(opened: boolean): void {
    this._opened.next(opened);
  }

  /**
   * Obtém o estado atual do sidenav
   * @returns objeto com todos os estados atuais
   */
  getCurrentState(): { expanded: boolean; isMobile: boolean; mode: 'side' | 'over'; opened: boolean } {
    return {
      expanded: this._expanded.value,
      isMobile: this._isMobile.value,
      mode: this._mode.value,
      opened: this._opened.value
    };
  }

  /**
   * Fecha o sidenav (usado principalmente em mobile)
   */
  close(): void {
    this._opened.next(false);
  }
}
