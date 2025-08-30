export class InviteModel {
  id!: string;
  email!: string;
  type!: string;
  role!: string;
  status!: InviteStatus;
  created_at!: Date;
  updated_at!: Date;
}

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}
