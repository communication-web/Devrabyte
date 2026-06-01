import { requireOrg } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const { organization, membership } = await requireOrg();
  const canEdit = membership.role === 'OWNER' || membership.role === 'ADMIN';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Settings</p>
        <h1 className="font-display text-4xl tracking-tight">Workspace settings</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <SettingsForm
              initial={{
                name: organization.name,
                industry: organization.industry ?? '',
                teamSize: organization.teamSize ?? '',
                timezone: organization.timezone,
                dailySummaryAt: organization.dailySummaryAt,
              }}
            />
          ) : (
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{organization.name}</dd>
              <dt className="text-muted-foreground">Industry</dt>
              <dd>{organization.industry ?? '—'}</dd>
              <dt className="text-muted-foreground">Timezone</dt>
              <dd>{organization.timezone}</dd>
              <dt className="text-muted-foreground">Daily summary</dt>
              <dd className="tabular">{organization.dailySummaryAt}</dd>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
