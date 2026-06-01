import { MessageCircle } from 'lucide-react';
import { requireOrg } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRelative } from '@/lib/utils';
import { LinkPhoneForm } from './link-phone-form';

export default async function WhatsAppPage() {
  const { organization, user } = await requireOrg();

  const messages = await prisma.message.findMany({
    where: { organizationId: organization.id, channel: 'WHATSAPP' },
    orderBy: { createdAt: 'desc' },
    take: 40,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">WhatsApp</p>
        <h1 className="font-display text-4xl tracking-tight">Your WhatsApp inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The phone number linked here becomes your command line for Devrabyte. Assign tasks, ask
          for summaries, mark things done — all from the chat thread you already use.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your phone number</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkPhoneForm currentPhone={user.phone ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent messages</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {messages.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-5 w-5" />}
              title="No WhatsApp activity yet"
              description="Link your number above, then send a message to your Devrabyte number to get started."
            />
          ) : (
            <div className="divide-y divide-border/60">
              {messages.map((m) => (
                <div key={m.id} className="flex items-start gap-3 py-3 text-sm">
                  <Badge variant={m.direction === 'INBOUND' ? 'info' : 'muted'} className="shrink-0 capitalize">
                    {m.direction === 'INBOUND' ? 'in' : 'out'}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.user?.name ?? m.fromNumber ?? m.toNumber ?? 'unknown'}
                      {m.parsedIntent ? ` · ${m.parsedIntent}` : ''} · {formatRelative(m.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-5 text-sm">
          <p className="font-medium">What you can say</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>• "Assign Mary to follow up with ABC Ltd tomorrow morning, high priority"</li>
            <li>• "What's pending today?"</li>
            <li>• "Show overdue tasks"</li>
            <li>• "Mark the ABC follow-up as done"</li>
            <li>• "Summarize the week"</li>
            <li>• "What's blocking us?"</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
