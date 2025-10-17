export class DashboardModel {
  products!: number
  entereds!: number
  exits!: number
  lowStock!: number
  totalProducts!: number
  
  // Porcentagens de crescimento
  productsGrowth?: number
  enteredsGrowth?: number
  exitsGrowth?: number
  
  // Status/mensagens
  lowStockStatus?: string

  thisMonthEntriesQuantity?: number
  thisMonthExitsQuantity?: number
  
  // Novas seções
  weeklyMovement?: WeeklyMovementData[]
  weeklySummary?: WeeklySummaryData
  
  // Blocos finais
  lowStockProducts?: LowStockProduct[]
  recentActivities?: RecentActivity[]
}

export interface WeeklyMovementData {
  day: string
  dayLabel: string
  entries: number
  exits: number
}

export interface WeeklySummaryData {
  sales: number
  productsSold: number
  newProducts: number
  activeClients: number
}

export interface QuickActionData {
  id: string
  label: string
  icon: string
  color: 'primary' | 'secondary'
  action: string
}

export interface LowStockProduct {
  id: string
  name: string
  category: string
  currentQuantity: number
  minQuantity: number
  status: 'low' | 'out'
  unitOfMeasure?: {
    name: string
    abbreviation: string
  }
}

export interface RecentActivity {
  id: string
  type: 'entry' | 'exit'
  productName: string
  description: string
  timestamp: string
  user: string
}