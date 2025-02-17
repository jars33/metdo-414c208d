
import { useQuery } from "@tanstack/react-query"
import { format, startOfYear, endOfYear } from "date-fns"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { TeamMemberAllocationDialog } from "./TeamMemberAllocationDialog"
import { useState } from "react"
import type { TeamMember } from "@/types/team-member"

interface TeamMemberTimelineProps {
  member: TeamMember
  selectedYear: number
}

interface AllocationData {
  id: string
  month: string
  allocation_percentage: number
  project: {
    id: string
    name: string
    number: string
  }
}

export function TeamMemberTimeline({ member, selectedYear }: TeamMemberTimelineProps) {
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const currentDate = new Date()

  const { data: allocations, refetch } = useQuery({
    queryKey: ["team-member-allocations", member.id, selectedYear],
    queryFn: async () => {
      const startDate = format(startOfYear(new Date(selectedYear, 0)), 'yyyy-MM-dd')
      const endDate = format(endOfYear(new Date(selectedYear, 0)), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from("project_member_allocations")
        .select(`
          id,
          month,
          allocation_percentage,
          project_assignments!inner (
            project:projects(
              id,
              name,
              number
            )
          )
        `)
        .eq("project_assignments.team_member_id", member.id)
        .gte("month", startDate)
        .lte("month", endDate)
        .order("month")

      if (error) throw error

      return data.map(allocation => ({
        id: allocation.id,
        month: allocation.month,
        allocation_percentage: allocation.allocation_percentage,
        project: allocation.project_assignments.project
      })) as AllocationData[]
    },
  })

  const months = Array.from({ length: 12 }, (_, i) => {
    return new Date(selectedYear, i, 1)
  })

  const getAllocationColor = (percentage: number) => {
    if (percentage > 100) return 'text-red-500 dark:text-red-400'
    if (percentage === 100) return 'text-green-500 dark:text-green-400'
    return 'text-yellow-500 dark:text-yellow-400'
  }

  const handleAllocationClick = (projectId: string) => {
    navigate(`/projects/${projectId}`)
  }

  const handleAllocationSubmit = async (values: { projectId: string; month: Date; allocation: string }) => {
    try {
      const { data: existingAssignment, error: assignmentError } = await supabase
        .from("project_assignments")
        .select("id")
        .eq("team_member_id", member.id)
        .eq("project_id", values.projectId)
        .maybeSingle()

      if (assignmentError) throw assignmentError

      let assignmentId: string

      if (existingAssignment) {
        assignmentId = existingAssignment.id
      } else {
        const { data: newAssignment, error: createError } = await supabase
          .from("project_assignments")
          .insert({
            team_member_id: member.id,
            project_id: values.projectId,
            start_date: format(values.month, 'yyyy-MM-dd'),
          })
          .select()
          .single()

        if (createError) throw createError
        assignmentId = newAssignment.id
      }

      const { error: allocationError } = await supabase
        .from("project_member_allocations")
        .insert({
          project_assignment_id: assignmentId,
          month: format(values.month, 'yyyy-MM-dd'),
          allocation_percentage: parseInt(values.allocation),
        })

      if (allocationError) throw allocationError

      await refetch()
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Error submitting allocation:", error)
      throw error
    }
  }

  const isCurrentMonth = (month: Date) => {
    return month.getMonth() === currentDate.getMonth() && 
           month.getFullYear() === currentDate.getFullYear()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{member.name}</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsDialogOpen(true)}
          className="hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Allocation
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="grid grid-cols-[repeat(12,_minmax(120px,_1fr))] gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden min-w-[1440px]">
          {months.map((month) => {
            const monthStr = format(month, "yyyy-MM")
            const monthAllocations = allocations?.filter(allocation => 
              format(new Date(allocation.month), "yyyy-MM") === monthStr
            ) || []
            
            const totalAllocation = monthAllocations.reduce(
              (sum, allocation) => sum + allocation.allocation_percentage, 
              0
            )

            return (
              <div 
                key={month.getTime()} 
                className={`p-2 min-h-[80px] bg-white dark:bg-gray-800 ${
                  isCurrentMonth(month) ? 'ring-2 ring-primary ring-inset bg-primary/5 dark:bg-primary/5' : ''
                }`}
              >
                <div className="text-xs font-medium mb-1 text-center">
                  {format(month, "MMM")}
                </div>
                <div className="space-y-1">
                  {monthAllocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      onClick={() => handleAllocationClick(allocation.project.id)}
                      className="text-xs p-1.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title={`${allocation.project.name} (${allocation.project.number})`}
                    >
                      <div className="font-medium truncate">
                        {allocation.project.number}
                      </div>
                      <div className="truncate text-gray-600 dark:text-gray-400">
                        {allocation.project.name}
                      </div>
                      <div className={`font-medium ${getAllocationColor(allocation.allocation_percentage)}`}>
                        {allocation.allocation_percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      <TeamMemberAllocationDialog
        teamMemberId={member.id}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAllocationSubmit}
      />
    </Card>
  )
}
