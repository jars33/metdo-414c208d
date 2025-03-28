
import { Card } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import type { TeamNode } from "@/types/team"
import { useTranslation } from "react-i18next"

interface OrganizationChartProps {
  teams: TeamNode[]
}

export function OrganizationChart({ teams }: OrganizationChartProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const renderTeamNode = (node: TeamNode) => {
    if (!node) return null

    return (
      <div key={node.id} className="flex flex-col items-center">
        <Card 
          className="p-4 w-64 cursor-pointer hover:bg-accent"
          onClick={() => navigate(`/teams/${node.id}`)}
        >
          <h3 className="font-semibold text-lg mb-2">{node.name}</h3>
          {node.manager && (
            <div className="text-sm text-muted-foreground mb-2">
              {t('team.manager')}: {node.manager.name}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {node.members?.length || 0} {t('team.members')}
          </div>
        </Card>
        
        {node.children?.length > 0 && (
          <div className="mt-8 flex gap-8">
            {node.children.map(child => renderTeamNode(child))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-8 overflow-auto">
      <div className="flex justify-center">
        {teams?.map(team => renderTeamNode(team)) || null}
      </div>
    </div>
  )
}
