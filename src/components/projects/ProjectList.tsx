
import { Edit2Icon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

type Project = {
  id: string
  number: string
  name: string
  status: "planned" | "in_progress" | "completed" | "cancelled"
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  user_id: string
}

const statusColors = {
  planned: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

interface ProjectListProps {
  projects: Project[]
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onSelect: (project: Project) => void
  selectedProject: Project | null
}

export function ProjectList({
  projects,
  onEdit,
  onDelete,
  onSelect,
  selectedProject,
}: ProjectListProps) {
  const { t } = useTranslation();

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case "planned": return t('project.planned');
      case "in_progress": return t('project.inProgress');
      case "completed": return t('project.completed');
      case "cancelled": return t('project.cancelled');
      default: return status;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('project.projectNumber')}</TableHead>
            <TableHead>{t('project.name')}</TableHead>
            <TableHead>{t('project.status')}</TableHead>
            <TableHead>{t('project.startDate')}</TableHead>
            <TableHead>{t('project.endDate')}</TableHead>
            <TableHead className="w-[100px]">{t('project.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects?.map((project) => (
            <TableRow
              key={project.id}
              className={cn(
                "cursor-pointer hover:bg-muted/50",
                selectedProject?.id === project.id && "bg-muted"
              )}
              onClick={() => onSelect(project)}
            >
              <TableCell>{project.number}</TableCell>
              <TableCell>{project.name}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[project.status]}>
                  {getStatusTranslation(project.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell>
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(project)
                    }}
                  >
                    <Edit2Icon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(project)
                    }}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
