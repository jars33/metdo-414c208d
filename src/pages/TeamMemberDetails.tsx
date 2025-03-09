
import React, { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { TeamMemberForm } from "@/components/team/TeamMemberForm"
import { SalaryHistory } from "@/components/team/salary/SalaryHistory"
import { useAuth } from "@/components/AuthProvider"
import { useTeamMember } from "@/hooks/use-team-member"
import { useManagedTeamMembers } from "@/hooks/use-managed-team-members"
import type { TeamMemberFormSchema } from "@/components/team/team-member-schema"

export default function TeamMemberDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { toast } = useToast()
  const { member, salaryHistory, isMemberLoading, isSalaryLoading, refetchSalaryHistory } = useTeamMember(id)
  const { data: managedMembers, isLoading: isManagedMembersLoading } = useManagedTeamMembers()
  
  const canAccessMember = React.useMemo(() => {
    // Always allow access to the 'new' route
    if (id === 'new') return true
    if (!id || !managedMembers) return false
    
    const memberId = id.toString()
    // Check if the user has access to this team member
    return managedMembers.some(managedMember => managedMember.id === memberId)
  }, [id, managedMembers])

  useEffect(() => {
    // Skip this check for the 'new' route
    if (id === 'new') return;
    
    // Only redirect if we've loaded managed members, the member isn't loading, 
    // and the user doesn't have access to this specific member
    if (!isManagedMembersLoading && !isMemberLoading && !canAccessMember && id !== 'new') {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to view or edit this team member",
      })
      navigate("/team")
    }
  }, [canAccessMember, isManagedMembersLoading, isMemberLoading, navigate, toast, id])

  const handleAddSalary = async (values: { amount: string, start_date: string, end_date: string }) => {
    if (!id || id === 'new' || !session?.user.id) return;

    try {
      const { error } = await supabase
        .from("salary_history")
        .insert({
          team_member_id: id,
          amount: parseFloat(values.amount),
          start_date: values.start_date,
          end_date: values.end_date,
        })

      if (error) throw error

      await refetchSalaryHistory()

      toast({
        title: "Success",
        description: "Salary history updated successfully",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
  }

  async function onSubmit(values: TeamMemberFormSchema) {
    console.log("Starting team member submission with values:", values);
    if (!session?.user.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to perform this action",
      })
      return
    }

    try {
      const teamMemberData = {
        name: values.name,
        start_date: values.start_date,
        end_date: values.end_date,
        personal_phone: values.personal_phone || null,
        personal_email: values.personal_email || null,
        company_phone: values.company_phone || null,
        company_email: values.company_email || null,
        type: values.type,
        left_company: values.left_company,
        user_id: session.user.id,
      }

      console.log("Submitting team member data:", teamMemberData)

      if (id && id !== 'new') {
        // Update existing team member
        const { error: teamMemberError } = await supabase
          .from("team_members")
          .update(teamMemberData)
          .eq("id", id)

        if (teamMemberError) {
          console.error("Update error:", teamMemberError)
          throw teamMemberError
        }

        console.log("Successfully updated team member");

        // Add salary if provided
        if (values.salary.amount) {
          const { error: salaryError } = await supabase
            .from("salary_history")
            .insert({
              team_member_id: id,
              amount: parseFloat(values.salary.amount),
              start_date: values.salary.start_date,
              end_date: values.salary.end_date,
            })

          if (salaryError) {
            console.error("Salary insert error:", salaryError);
            throw salaryError;
          }
          console.log("Successfully added salary history");
        }
      } else {
        // Create new team member
        console.log("Creating new team member with data:", teamMemberData);
        const { data: newMember, error: teamMemberError } = await supabase
          .from("team_members")
          .insert(teamMemberData)
          .select()

        if (teamMemberError) {
          console.error("Insert error:", teamMemberError)
          throw teamMemberError
        }

        console.log("New team member created:", newMember);

        // Add salary if provided and team member was created successfully
        if (values.salary.amount && newMember && newMember.length > 0) {
          const newMemberId = newMember[0].id;
          
          const { error: salaryError } = await supabase
            .from("salary_history")
            .insert({
              team_member_id: newMemberId,
              amount: parseFloat(values.salary.amount),
              start_date: values.salary.start_date,
              end_date: values.salary.end_date,
            })

          if (salaryError) {
            console.error("Salary insert error:", salaryError);
            throw salaryError;
          }
          console.log("Successfully added salary history for new member");
        }
      }

      toast({
        title: "Success",
        description: `Team member successfully ${id && id !== 'new' ? "updated" : "added"}`,
      })
      
      navigate("/team")
    } catch (error: any) {
      console.error("Error in onSubmit:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
  }

  // For the 'new' route, skip loading checks and show form immediately
  if (id === 'new') {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Add Team Member</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/team")}>
              Back to List
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <TeamMemberForm
            member={null}
            userId={session?.user.id || ""}
            onSubmit={onSubmit}
            mode="new"
          />
        </div>
      </div>
    );
  }

  // For existing member routes, show loading state or deny access
  if (isMemberLoading || isSalaryLoading || isManagedMembersLoading) {
    return <div className="p-8">Loading...</div>
  }

  // If access is denied, this will be caught by the useEffect above
  // but we add an additional check here just to be safe
  if (!canAccessMember) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Edit Team Member</h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate("/team")}>
            Back to List
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <TeamMemberForm
          member={member}
          userId={session?.user.id || ""}
          onSubmit={onSubmit}
          mode="edit"
        />

        {id !== 'new' && (
          <SalaryHistory 
            id={id} 
            salaryHistory={salaryHistory} 
            handleAddSalary={handleAddSalary} 
          />
        )}
      </div>
    </div>
  )
}
