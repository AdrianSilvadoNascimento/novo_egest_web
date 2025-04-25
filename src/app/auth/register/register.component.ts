import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  UserPlus,
  User,
  Mail,
  Lock
} from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  readonly UserPlusIcon = UserPlus;
  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;

  onSubmit() { }
}
