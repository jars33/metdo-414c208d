
import { format } from "date-fns"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  CircleDollarSign,
  TrendingDown,
  CircleUser,
  Info,
  Calculator,
} from "lucide-react"

interface TimelineMonthProps {
  month: Date
  revenues: any[]
  variableCosts: any[]
  overheadCosts: any[]
  allocations: any[]
  onSelectRevenue: (revenue: any) => void
  onSelectVariableCost: (cost: any) => void
  onSelectOverheadCost: (cost: any) => void
  onSelectAllocation: (allocation: any) => void
  accumulatedProfit: number
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
  accumulatedProfit,
}: TimelineMonthProps) {
  const totalRevenues = revenues.reduce((sum, r) => sum + Number(r.amount), 0)
  const totalVariableCosts = variableCosts.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  )
  const totalOverheadCosts = overheadCosts.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  )
  
  const totalSalaryCosts = allocations.reduce(
    (sum, a) => sum + Number(a.salary_cost),
    0
  )

  const totalCosts = totalVariableCosts + totalOverheadCosts + totalSalaryCosts
  const monthProfit = totalRevenues - totalCosts

  const monthLabel = format(month, "MMM yyyy")
  
  const isCurrentMonth =
    new Date().getMonth() === month.getMonth() &&
    new Date().getFullYear() === month.getFullYear()

  return (
    <div 
      className={cn(
        "p-4 space-y-2 border-r border-gray-200 dark:border-gray-800",
        isCurrentMonth ? "bg-blue-50 dark:bg-blue-900/20" : "bg-white dark:bg-gray-900"
      )}
    >
      <div className="text-center font-medium text-sm mb-3">
        {monthLabel}
      </div>

      {/* Revenues */}
      {revenues.length > 0 && (
        <div className="text-center text-sm font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(totalRevenues)}
        </div>
      )}

      {/* Allocations */}
      {allocations.map((allocation) => (
        <div
          key={allocation.id}
          onClick={() => onSelectAllocation(allocation)}
          className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 p-2 rounded-md text-xs cursor-pointer"
        >
          <div className="font-medium">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(-allocation.salary_cost)}
          </div>
          <div className="truncate">
            {allocation.team_member_name} ({allocation.allocation_percentage}%)
          </div>
        </div>
      ))}

      {/* Variable Costs */}
      {variableCosts.map((cost) => (
        <div
          key={cost.id}
          onClick={() => onSelectVariableCost(cost)}
          className="bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 p-2 rounded-md text-xs cursor-pointer"
        >
          <div className="font-medium">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(-cost.amount)}
          </div>
          {cost.description && (
            <div className="truncate">
              {cost.description}
            </div>
          )}
        </div>
      ))}

      {/* Overhead Costs */}
      {overheadCosts.map((cost) => (
        <div
          key={cost.id}
          className="bg-orange-50 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 p-2 rounded-md text-xs"
        >
          <div className="font-medium">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(-cost.amount)}
          </div>
          <div className="truncate">
            {cost.description || "11% overhead"}
          </div>
        </div>
      ))}

      {/* Month total */}
      <div className={cn(
        "mt-auto pt-2 text-center font-medium text-sm",
        monthProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      )}>
        {new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(monthProfit)}
      </div>
    </div>
  )
}
