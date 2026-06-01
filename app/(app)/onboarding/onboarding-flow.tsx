'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Template = { key: string; name: string; description: string };

const INDUSTRIES = [
  'Professional services',
  'Consulting',
  'Logistics',
  'Retail',
  'Fintech',
  'Agency',
  'Healthcare',
  'Education',
  'Manufacturing',
  'Other',
];

const TEAM_SIZES = ['Just me', '2-5', '6-20', '21-50', '50+'];

export function OnboardingFlow({
  orgName,
  templates,
}: {
  orgName: string;
  templates: Template[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    industry: 'Professional services',
    teamSize: '2-5',
    dailySummaryAt: '08:00',
    timezone: 'Africa/Lagos',
    templateKey: 'client_onboarding',
  });
  const [loading, setLoading] = useState(false);

  async function finish() {
    setLoading(true);
    try {
      await fetch('/api/organizations/onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      router.push('/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    {
      title: 'Tell us about your business',
      body: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            >
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Team size</Label>
            <div className="flex flex-wrap gap-2">
              {TEAM_SIZES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, teamSize: t })}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-colors',
                    form.teamSize === t
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:bg-secondary',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'When should we send your daily summary?',
      body: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Time (24h)</Label>
            <div className="flex flex-wrap gap-2">
              {['06:00', '07:00', '08:00', '09:00', '10:00'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, dailySummaryAt: t })}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-colors tabular',
                    form.dailySummaryAt === t
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:bg-secondary',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            >
              <option>Africa/Lagos</option>
              <option>Africa/Accra</option>
              <option>Africa/Nairobi</option>
              <option>Africa/Johannesburg</option>
              <option>Africa/Cairo</option>
              <option>Europe/London</option>
              <option>America/New_York</option>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: 'Pick a starter workflow',
      body: (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.slice(0, 8).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setForm({ ...form, templateKey: t.key })}
              className={cn(
                'rounded-lg border p-4 text-left transition-colors',
                form.templateKey === t.key
                  ? 'border-foreground bg-secondary'
                  : 'border-border hover:bg-secondary/60',
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t.name}</p>
                {form.templateKey === t.key ? <Check className="h-4 w-4" /> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "You're ready",
      body: (
        <div className="rounded-lg border border-border bg-card p-6 text-sm">
          <p className="text-muted-foreground">Workspace</p>
          <p className="font-medium">{orgName}</p>
          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Industry</dt>
            <dd>{form.industry}</dd>
            <dt className="text-muted-foreground">Team size</dt>
            <dd>{form.teamSize}</dd>
            <dt className="text-muted-foreground">Daily summary</dt>
            <dd className="tabular">
              {form.dailySummaryAt} · {form.timezone}
            </dd>
            <dt className="text-muted-foreground">Starter workflow</dt>
            <dd>{templates.find((t) => t.key === form.templateKey)?.name}</dd>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            You can change all of this later in Settings.
          </p>
        </div>
      ),
    },
  ];

  const total = steps.length;
  const current = steps[step];
  const isLast = step === total - 1;

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i <= step ? 'bg-foreground' : 'bg-border',
              )}
            />
          ))}
        </div>
        <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
          Step {step + 1} of {total}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{current.title}</h1>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">{current.body}</div>
      <div className="mt-6 flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {isLast ? (
          <Button onClick={finish} disabled={loading}>
            {loading ? 'Setting up…' : 'Go to dashboard'}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => Math.min(total - 1, s + 1))}>
            Continue <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
