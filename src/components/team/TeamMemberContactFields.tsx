
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { UseFormReturn } from "react-hook-form"
import type { TeamMemberFormSchema } from "./team-member-schema"
import { useTranslation } from "react-i18next"

interface TeamMemberContactFieldsProps {
  form: UseFormReturn<TeamMemberFormSchema>
}

export function TeamMemberContactFields({ form }: TeamMemberContactFieldsProps) {
  const { t } = useTranslation()
  
  return (
    <>
      <FormField
        control={form.control}
        name="company_phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('team.companyPhone', "Company Phone")}</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="company_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('team.companyEmail', "Company Email")}</FormLabel>
            <FormControl>
              <Input type="email" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
