
import { useParams, useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { PlusCircle } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { TeamMemberBasicFields } from "@/components/team/TeamMemberBasicFields"
import { TeamMemberContactFields } from "@/components/team/TeamMemberContactFields"
import { teamMemberFormSchema, type TeamMemberFormSchema } from "@/components/team/team-member-schema"
import type { TeamMember, TeamMemberFormValues, SalaryHistory } from "@/types/team-member"

export default function TeamMemberDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { toast } = useToast()

  const form = useForm<TeamMemberFormSchema>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: "",
      salary: {
        amount: "",
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: null,
      },
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: null,
      personal_phone: null,
      personal_email: null,
      company_phone: null,
      company_email: null,
      type: "contract" as const,
      left_company: false,
      user_id: "",
    },
  })

  const { data: member, isLoading } = useQuery({
    queryKey: ["team-member", id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error

      // Set the form values when we get the member data
      if (data) {
        form.reset({
          name: data.name,
          start_date: data.start_date,
          end_date: data.end_date,
          personal_phone: data.personal_phone,
          personal_email: data.personal_email,
          company_phone: data.company_phone,
          company_email: data.company_email,
          type: data.type,
          left_company: data.left_company,
          user_id: data.user_id,
          salary: {
            amount: "",
            start_date: format(new Date(), 'yyyy-MM-dd'),
            end_date: null,
          }
        })
      }
      
      return data as TeamMember
    },
    enabled: !!id,
  })

  const { data: initialSalary, refetch: refetchInitialSalary } = useQuery({
    queryKey: ["team-member-salary", id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('salary_history')
        .select('*')
        .eq('team_member_id', id)
        .order('start_date', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        form.setValue("salary.amount", data.amount.toString())
        form.setValue("salary.start_date", data.start_date)
        form.setValue("salary.end_date", data.end_date)
      }
      return data
    },
    enabled: !!id && !!member,
  })

  const { data: salaryHistory, refetch: refetchSalary } = useQuery({
    queryKey: ["team-member-salaries", id],
    queryFn: async () => {
      if (!id) return []
      const { data, error } = await supabase
        .from('salary_history')
        .select('*')
        .eq('team_member_id', id)
        .order('start_date', { ascending: false })

      if (error) throw error
      return data as SalaryHistory[]
    },
    enabled: !!id,
  })

  const salaryForm = useForm({
    defaultValues: {
      amount: "",
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: "",
    },
  })

  const checkDateOverlap = (startDate: string, endDate: string | null) => {
    if (!salaryHistory) return false;
    
    const newStart = new Date(startDate).getTime();
    const newEnd = endDate ? new Date(endDate).getTime() : Infinity;
    
    return salaryHistory.some(salary => {
      const salaryStart = new Date(salary.start_date).getTime();
      const salaryEnd = salary.end_date ? new Date(salary.end_date).getTime() : Infinity;
      
      return (newStart <= salaryEnd && newEnd >= salaryStart);
    });
  };

  const handleAddSalary = async (values: { amount: string, start_date: string, end_date: string }) => {
    if (!id || !session?.user.id) return;

    // Validate the dates
    if (values.end_date && new Date(values.end_date) < new Date(values.start_date)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "End date cannot be before start date",
      });
      return;
    }

    // Check for date overlap before submitting
    if (checkDateOverlap(values.start_date, values.end_date || null)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "The salary period overlaps with an existing period. Please adjust the dates.",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('add_salary_and_update_previous', {
        p_team_member_id: id,
        p_amount: parseFloat(values.amount),
        p_start_date: values.start_date,
        p_end_date: values.end_date || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "New salary added successfully",
      });
      
      // Reset form and refresh queries
      await Promise.all([refetchSalary(), refetchInitialSalary()]);
      
      // Hide the salary form
      const salarySection = document.getElementById('add-salary-section');
      if (salarySection) {
        salarySection.style.display = 'none';
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  const handleShowAddSalary = (e: React.MouseEvent) => {
    e.preventDefault();
    const salarySection = document.getElementById('add-salary-section');
    if (salarySection) {
      salarySection.style.display = 'block';
    }
  }

  const handleSubmit = async (values: TeamMemberFormSchema) => {
    if (!session?.user.id) return

    try {
      const teamMemberData = {
        name: values.name,
        start_date: values.start_date,
        end_date: values.end_date,
        personal_phone: values.personal_phone,
        personal_email: values.personal_email,
        company_phone: values.company_phone,
        company_email: values.company_email,
        type: values.type,
        left_company: values.left_company,
        user_id: session.user.id,
      }

      if (id) {
        // Update existing team member
        const { error: teamMemberError } = await supabase
          .from("team_members")
          .update(teamMemberData)
          .eq("id", id)

        if (teamMemberError) throw teamMemberError
      } else {
        // Insert new team member
        const { error: teamMemberError } = await supabase
          .from("team_members")
          .insert(teamMemberData)

        if (teamMemberError) throw teamMemberError
      }

      toast({
        title: "Success",
        description: `Team member ${id ? "updated" : "added"} successfully`,
      })
      navigate("/team")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          {id ? "Edit" : "Add"} Team Member
        </h1>
        <Button variant="outline" onClick={() => navigate("/team")}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <TeamMemberBasicFields form={form} />
          <TeamMemberContactFields form={form} />
          
          {id && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Salary History</h2>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  onClick={handleShowAddSalary}
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
              
              <div id="add-salary-section" style={{ display: 'none' }} className="mb-8">
                <Form {...salaryForm}>
                  <form onSubmit={salaryForm.handleSubmit(handleAddSalary)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={salaryForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={salaryForm.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={salaryForm.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit">Add Salary</Button>
                    </div>
                  </form>
                </Form>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Start Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">End Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {salaryHistory?.map((salary) => (
                      <tr key={salary.id}>
                        <td className="px-4 py-3 text-sm">{salary.amount}</td>
                        <td className="px-4 py-3 text-sm">{salary.start_date}</td>
                        <td className="px-4 py-3 text-sm">{salary.end_date || '-'}</td>
                      </tr>
                    ))}
                    {!salaryHistory?.length && (
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm text-center text-gray-500">
                          No salary history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => navigate("/team")}>
              Cancel
            </Button>
            <Button type="submit">
              {id ? "Update" : "Add"} Team Member
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
