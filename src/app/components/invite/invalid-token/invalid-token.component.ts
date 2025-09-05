import { Component, Input, OnInit } from '@angular/core';

import { MatCard } from "@angular/material/card";
import { AlertCircle, Clock, LucideAngularModule, XCircle } from 'lucide-angular';
import { INVITE_STATUS } from '../../../services/utils/constants/constants';

@Component({
  selector: 'app-invalid-token',
  standalone: true,
  imports: [MatCard, LucideAngularModule],
  templateUrl: './invalid-token.component.html',
  styleUrl: './invalid-token.component.scss'
})
export class InvalidTokenComponent implements OnInit {
  errorContent = {
    icon: Clock,
    title: '',
    description: '',
    bgColor: '',
    textColor: ''
  };

  readonly clockIcon = Clock;
  readonly xCircleIcon = XCircle;
  readonly alertCircleIcon = AlertCircle;

  @Input() status: string = '';
  @Input() expiresAt: Date = new Date();

  ngOnInit(): void {
    this.getErrorContent();
  }

  /**
   * Define o conteúdo do erro
   */
  getErrorContent(): void {
    switch (this.status) {
      case INVITE_STATUS.EXPIRED:
        this.errorContent = {
          icon: this.clockIcon,
          title: "Convite Expirado",
          description:
            "Este convite expirou em " +
            new Date(this.expiresAt).toLocaleDateString("pt-BR") +
            ". Entre em contato com o administrador da equipe para solicitar um novo convite.",
          bgColor: "bg-orange-100",
          textColor: "text-orange-600",
        }
        break;
      case INVITE_STATUS.CANCELLED:
        this.errorContent = {
          icon: this.xCircleIcon,
          title: "Convite Cancelado",
          description:
            "Este convite foi cancelado pela empresa. Se você acredita que isso é um erro, entre em contato com o administrador da equipe.",
          bgColor: "bg-red-100",
          textColor: "text-red-600",
        }
        break;
      case INVITE_STATUS.REJECTED:
        this.errorContent = {
          icon: this.xCircleIcon,
          title: "Convite Rejeitado",
          description:
            "Este convite foi rejeitado pelo destinatário. Se você acredita que isso é um erro, entre em contato com o administrador da equipe.",
          bgColor: "bg-red-100",
          textColor: "text-red-600",
        }
        break;
      default:
        this.errorContent = {
          icon: this.alertCircleIcon,
          title: "Convite Inválido",
          description:
            "Este link de convite é inválido ou não existe. Verifique se o link está correto ou entre em contato com o administrador da equipe.",
          bgColor: "bg-red-100",
          textColor: "text-red-600",
        }
        break;
    }
  }
}
