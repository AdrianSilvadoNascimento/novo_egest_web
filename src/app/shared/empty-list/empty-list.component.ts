import { Component, Input } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';

@Component({
  selector: 'app-empty-list',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './empty-list.component.html',
  styleUrl: './empty-list.component.scss'
})
export class EmptyListComponent {
  @Input() description!: string
  @Input() icon!: LucideIconData
}
