
import React, { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/AuthProvider"
import { useTeamMember } from "@/hooks/use-team-member"
import { AddTeamMember } from "@/components/team/AddTeamMember"
import { EditTeamMember } from "@/components/team/EditTeamMember"

export default function TeamMemberDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { toast } = useToast()
  
  // Special case for the 'new' route - always allow access
  const isNewMember = id === 'new'
  
  // Make sure we have a session
  if (!session?.user?.id) {
    return <div className="p-8">Please log in to add or edit team members.</div>
  }
  
  // If it's a new member, render the AddTeamMember component immediately
  if (isNewMember) {
    console.log("Rendering AddTeamMember component for new member")
    return <AddTeamMember userId={session.user.id} />
  }
  
  // For existing members, fetch data
  const { 
    member, 
    salaryHistory, 
    isMemberLoading, 
    isSalaryLoading, 
    refetchSalaryHistory 
  } = useTeamMember(id)
  
  // Show loading state while data is being fetched
  if (isMemberLoading || isSalaryLoading) {
    return <div className="p-8">Loading...</div>
  }
  
  // Make sure we have a valid ID for existing members
  if (!id) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "No team member ID found"
    })
    navigate("/team")
    return null
  }

  return (
    <EditTeamMember
      id={id}
      member={member}
      salaryHistory={salaryHistory}
      userId={session.user.id}
      refetchSalaryHistory={refetchSalaryHistory}
    />
  )
}
