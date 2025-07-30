import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash, Eye, DollarSign, Calendar } from "lucide-react";
import type { DashboardProject } from "@/types";

interface ProjectListProps {
  projects: DashboardProject[];
  isLoading: boolean;
  userType: 'freelancer' | 'company' | 'admin' | null;
  onDeleteClick: (project: DashboardProject) => void;
  deletingProjectId: string | null;
  emptyStateMessage: string;
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'open' || status === 'active') return 'default';
    if (status === 'in_progress') return 'default';
    if (status === 'pending') return 'secondary';
    if (status === 'completed') return 'default';
    return 'destructive';
}

export function ProjectList({ projects, isLoading, userType, onDeleteClick, deletingProjectId, emptyStateMessage }: ProjectListProps) {
  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (projects.length === 0) {
    return <p className="text-muted-foreground text-center py-10">{emptyStateMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link href={`/projects/${project.id}`} key={project.id} className="block group">
          <Card className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 h-full group-hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">{project.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground"><DollarSign className="h-4 w-4 mr-2" /><span>Orçamento: R$ {project.budget.toLocaleString('pt-BR')}</span></div>
              <div className="flex items-center text-muted-foreground"><Calendar className="h-4 w-4 mr-2" /><span>Prazo: {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definido'}</span></div>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4 bg-muted/50">
              <Badge
                variant={project.status === 'open' || project.status === 'in_progress' || project.status === 'completed' ? 'default' : getStatusVariant(project.status)}
                className={`capitalize ${project.status === 'open' ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : ''} ${project.status === 'in_progress' ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent' : ''} ${project.status === 'completed' ? 'bg-slate-500 hover:bg-slate-600 text-white border-transparent' : ''}`}
              >
                {project.status.replace('_', ' ')}</Badge>
              <div className="space-x-2">
                {userType === 'company' && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100" onClick={(e) => { e.preventDefault(); onDeleteClick(project); }} disabled={deletingProjectId === project.id}>
                    {deletingProjectId === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}