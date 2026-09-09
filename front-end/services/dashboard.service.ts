import { api } from "@/lib/api"

export type DashboardStats = {
  label: string
  value: string
  trend: string
  up: boolean
  sub: string
  icon: string
  color: string
}

export type DashboardProject = {
  id: number
  name: string
  customer: string
  stage: "REQUIREMENTS" | "DESIGN" | "DEVELOPMENT" | "TESTING" | "DEPLOYMENT" | "LIVE"
  team: string[]
  updated: string
}

export type DashboardMilestone = {
  id: number
  title: string
  project: string
  dueDate: string
  overdue: boolean
}

export type DashboardLead = {
  id: number
  name: string
  company: string
  status: "NEW" | "CONTACTED" | "PENDING" | "ON_HOLD" | "WON" | "LOST"
  days: number
}

export type FinanceSnapshot = {
  totalInvoiced: string
  totalPaid: string
  totalOutstanding: string
  totalOverdue: string
  overdueInvoices: {
    id: number
    customer: string
    amount: string
    days: number
  }[]
}

export type DashboardCampaign = {
  id: number
  name: string
  budget: string
  spend: string
  leads: number
  rate: string
}

export type LeadsChartData = {
  month: string
  new: number
  contacted: number
  won: number
}

export type DashboardOverview = {
  stats: DashboardStats[]
  projects: DashboardProject[]
  milestones: DashboardMilestone[]
  leads: DashboardLead[]
  financeSnapshot: FinanceSnapshot
  campaigns: DashboardCampaign[]
  leadsChart: LeadsChartData[]
}

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    const response = await api.get<{ status: number; data: DashboardOverview }>("/dashboard/overview")
    return response.data.data
  },
}
