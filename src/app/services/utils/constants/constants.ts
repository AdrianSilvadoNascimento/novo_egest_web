export const ERROR_MESSAGES = {
  INVITE_CONSTANTS: {
    INVITE_EXPIRED: 'Este convite expirou. Solicite um novo convite.',
    INVITE_ALREADY_ACCEPTED: 'Este convite já foi aceito.',
    INVITE_CANCELLED: 'Este convite foi cancelado.',
    INVITE_REJECTED: 'Este convite foi rejeitado.',
    INVALID_TOKEN: 'Token de convite inválido.',
    EMAIL_ALREADY_EXISTS: 'Este email já está sendo usado na conta.',
    PLAN_LIMIT_REACHED: 'Seu plano atual não permite mais usuários.',
    RATE_LIMIT_EXCEEDED: 'Limite de convites diários atingido.',
    INSUFFICIENT_PERMISSIONS: 'Você não tem permissão para convidar usuários.'
  }
}

export const INVITE_STATUS = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
  REJECTED: 'Rejeitado'
} as const;
