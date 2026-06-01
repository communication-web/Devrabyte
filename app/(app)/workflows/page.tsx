import Link from 'next/link';
import { Plus, Workflow as WorkflowIcon } from 'lucide-react';
import { requireOrg } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { WORKFLOW_TEMPLATES } from '@/lib/workflows/templates';
import { ImportTemplateButton } from './import-template-button';

export default async function WorkflowsPage() {
  const { organization } = await requireOrg();
  const workflows = await prisma.workflow.findMany({
    where: { organizationId: organization.id, deletedAt: null },
    include: {
      stages: { orderBy: { order: 'asc' } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Workflows</p>
          <h1 className="font-display text-4xl tracking-tight">Your workflows</h1>
        </div>
      </div>

      {workflows.length === 0 ? (
        <EmptyState
          icon={<WorkflowIcon className="h-5 w-5" />}
          title="No workflows yet"
          description="Start with a template — you can customise every stage later."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workflows.map((w) => (
            <Card key={w.id}>
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle>{w.name}</CardTitle>
                  {w.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
                  ) : null}
                </div>
                <Badge variant={w.isActive ? 'success' : 'muted'}>
                  {w.isActive ? 'active' : 'paused'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-1.5">
                  {w.stages.map((s, idx) => (
                    <span key={s.id} className="flex items-center gap-1.5">
                      <span className="rounded-md bg-secondary px-2 py-1 text-xs">{s.name}</span>
                      {idx < w.stages.length - 1 ? (
                        <span className="text-muted-foreground">›</span>
                      ) : null}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{w._count.tasks} tasks · {w.stages.length} stages</span>
                  <Link href={`/tasks?workflowId=${w.id}`} className="text-foreground underline-offset-2 hover:underline">
                    View tasks
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Templates */}
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Templates</p>
            <h2 className="text-2xl font-medium tracking-tight">Start from a template</h2>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_TEMPLATES.map((t) => (
            <Card key={t.key}>
              <CardContent className="p-5">
                <h3 className="text-sm font-medium">{t.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {t.stages.map((s) => (
                    <span key={s.name} className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                      {s.name}
                    </span>
                  ))}
                </div>
                <ImportTemplateButton templateKey={t.key} name={t.name} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
