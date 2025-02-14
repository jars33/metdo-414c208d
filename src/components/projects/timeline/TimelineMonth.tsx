
import { format } from "date-fns"

interface TimelineItem {
  id: string
  month: string
  amount: number
  description?: string
}

interface AllocationItem {
  id: string
  month: string
  allocation_percentage: number
  team_member_name: string
  salary_cost: number
  team_member_id: string
  project_assignment_id: string
}

interface TimelineMonthProps {
  month: Date
  revenues: TimelineItem[]
  variableCosts: TimelineItem[]
  overheadCosts: TimelineItem[]
  allocations: AllocationItem[]
  onSelectRevenue: (revenue: TimelineItem) => void
  onSelectVariableCost: (cost: TimelineItem) => void
  onSelectOverheadCost: (cost: TimelineItem) => void
  onSelectAllocation?: (allocation: AllocationItem) => void
}

export function TimelineMonth({
  month,
  revenues,
  variableCosts,
  overheadCosts,
  allocations,
  onSelectRevenue,
  onSelectVariableCost,
  onSelectOverheadCost,
  onSelectAllocation,
}: TimelineMonthProps) {
  const totalRevenue = revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const totalVariableCosts = variableCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  const totalOverheadCosts = overheadCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  const totalSalaryCosts = allocations.reduce((sum, a) => sum + (Number(a.salary_cost) || 0), 0)
  const profit = totalRevenue - totalVariableCosts - totalOverheadCosts - totalSalaryCosts
  
  const hasCosts = variableCosts.length > 0 || overheadCosts.length > 0
  const hasRevenues = revenues.length > 0
  const hasAllocations = allocations.length > 0
  const hasAnyCosts = hasCosts || hasAllocations

  const formatAmount = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "0.00"
    return amount.toFixed(2)
  }

  return (
    <div className="bg-white p-4 min-h-[250px] flex flex-col">
      <div className="flex items-center justify-center gap-1 mb-4">
        <h3 className="text-sm font-medium">{format(month, "MMM yyyy")}</h3>
      </div>

      <div className="flex-1 flex flex-col items-center gap-4">
        {/* Revenues section */}
        <div className={`space-y-4 w-full flex flex-col items-center ${!hasAnyCosts ? 'flex-1' : ''}`}>
          {revenues.map((revenue) => (
            <div
              key={revenue.id}
              onClick={() => onSelectRevenue(revenue)}
              className="p-4 bg-green-50 border border-green-200 rounded text-sm cursor-pointer hover:bg-green-100 w-full text-center"
            >
              €{formatAmount(revenue.amount)}
            </div>
          ))}
        </div>

        {/* Separator line between revenues and costs */}
        {hasRevenues && hasAnyCosts && (
          <div className="border-t border-gray-200 w-full my-4" />
        )}

        {/* Allocations section */}
        <div className={`space-y-4 w-full flex flex-col items-center ${!hasRevenues && !hasCosts ? 'flex-1' : ''}`}>
          {allocations.map((allocation) => (
            <div
              key={allocation.id}
              onClick={() => onSelectAllocation?.(allocation)}
              className="p-4 bg-blue-50 border border-blue-200 rounded text-sm cursor-pointer hover:bg-blue-100 w-full text-center"
            >
              <div>{allocation.team_member_name}</div>
              <div className="text-xs text-gray-600">-€{formatAmount(allocation.salary_cost)}</div>
            </div>
          ))}
        </div>

        {/* Variable Costs section */}
        <div className={`space-y-4 w-full flex flex-col items-center ${!hasRevenues && !hasAllocations ? 'flex-1' : ''}`}>
          {variableCosts.map((cost) => (
            <div
              key={cost.id}
              onClick={() => onSelectVariableCost(cost)}
              className="p-4 bg-red-50 border border-red-200 rounded text-sm cursor-pointer hover:bg-red-100 w-full text-center"
            >
              <div>-€{formatAmount(cost.amount)}</div>
              {cost.description && (
                <div className="text-xs text-gray-600">{cost.description}</div>
              )}
            </div>
          ))}
        </div>

        {/* Overhead Costs section */}
        <div className={`space-y-4 w-full flex flex-col items-center ${!hasRevenues && !hasAllocations ? 'flex-1' : ''}`}>
          {overheadCosts.map((cost) => (
            <div
              key={cost.id}
              onClick={() => onSelectOverheadCost(cost)}
              className="p-4 bg-orange-50 border border-orange-200 rounded text-sm cursor-pointer hover:bg-orange-100 w-full text-center"
            >
              -€{formatAmount(cost.amount)}
            </div>
          ))}
        </div>
      </div>

      <div className={`mt-4 text-sm font-medium text-center ${
        profit >= 0 
          ? "text-green-600"
          : "text-red-600"
      }`}>
        €{formatAmount(profit)}
      </div>
    </div>
  )
}
