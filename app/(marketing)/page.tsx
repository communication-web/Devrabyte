import Link from 'next/link';
import { ArrowRight, MessageCircle, ListChecks, Workflow, AlertTriangle, BarChart3, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PLANS } from '@/lib/billing/paystack';

export default function Landing() {
  return (
    <main>
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <UseCases />
      <Pricing />
      <Faq />
      <CtaBand />
    </main>
  );
}

/* ----------------------- Hero ----------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="container relative py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Built for African SMEs · WhatsApp-first
          </div>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Run your operations <span className="italic text-muted-foreground">without</span> the chaos.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Devrabyte AI Ops turns WhatsApp into your operating system. Assign tasks, track
            follow-ups, catch bottlenecks, and get daily AI summaries — all without training your
            team on new software.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Start 14-day free trial <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#how">See how it works</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required. Cancel anytime.</p>
        </div>

        <HeroMock />
      </div>
    </section>
  );
}

function HeroMock() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="absolute inset-0 -z-10 rounded-[28px] bg-gradient-to-b from-muted/80 to-transparent blur-2xl" />
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_280px]">
          <div className="rounded-xl border border-border bg-background p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today at BrightLabs</p>
                <p className="font-display text-3xl">Good morning, Adaeze</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                3 wins today
              </span>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-3">
              {[
                { label: 'Open', value: '28' },
                { label: 'Due today', value: '5' },
                { label: 'Overdue', value: '2', danger: true },
                { label: 'Blocked', value: '1' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-muted p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className={`mt-1 text-2xl tabular ${s.danger ? 'text-rose-600' : ''}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              {[
                { t: 'Follow up with ABC Manufacturing', who: 'Mary · overdue', state: 'danger' as const },
                { t: 'Kickoff call with Zenith Imports', who: 'Tunde · 2pm', state: 'info' as const },
                { t: 'Respond to support ticket #4521', who: 'Mary · urgent', state: 'warning' as const },
              ].map((r) => (
                <div
                  key={r.t}
                  className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        r.state === 'danger'
                          ? 'bg-rose-500'
                          : r.state === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-sky-500'
                      }`}
                    />
                    <span>{r.t}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.who}</span>
                </div>
              ))}
            </div>
          </div>
          {/* WhatsApp panel */}
          <div className="rounded-xl border border-border bg-[#ece5dd] p-3 dark:bg-neutral-900">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </div>
            <div className="space-y-2 text-sm">
              <Bubble side="right">Assign to Mary: follow up with ABC tomorrow 10am</Bubble>
              <Bubble side="left">✅ Created "Follow up with ABC" for Mary, due tomorrow 10:00.</Bubble>
              <Bubble side="right">What's overdue?</Bubble>
              <Bubble side="left">
                🚨 2 overdue:
                <br />1. ABC Manufacturing — Mary
                <br />2. Support #4521 — Mary
              </Bubble>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ children, side }: { children: React.ReactNode; side: 'left' | 'right' }) {
  return (
    <div className={`flex ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] ${
          side === 'right'
            ? 'bg-[#dcf8c6] text-neutral-900 dark:bg-emerald-900 dark:text-emerald-50'
            : 'bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ----------------------- Social proof ----------------------- */
function SocialProof() {
  return (
    <section className="border-b border-border/60 py-10">
      <div className="container">
        <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">
          Built for the way African SMEs already work
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted-foreground">
          {['Consulting firms', 'Logistics', 'Agencies', 'Retail', 'Professional services', 'Fintech ops'].map(
            (t) => (
              <span key={t} className="opacity-80">
                {t}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- Features ----------------------- */
function Features() {
  const items = [
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: 'WhatsApp-first by design',
      body: 'Your team already uses WhatsApp. Assign tasks, update status, and get summaries without opening anything new.',
    },
    {
      icon: <ListChecks className="h-5 w-5" />,
      title: 'Tasks that never get lost',
      body: 'Every task has an owner, a due date, and a clear status. No more "I thought she was handling it".',
    },
    {
      icon: <Workflow className="h-5 w-5" />,
      title: 'Workflows out of the box',
      body: '10 templates for sales follow-up, client onboarding, service delivery, approvals, and more. Customise in minutes.',
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Bottleneck detection',
      body: 'We surface overdue clusters, blocked tasks, overloaded staff, and slow stages — before they become fires.',
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Daily & weekly summaries',
      body: 'Wake up to a clear picture of yesterday and what matters today, written in plain language.',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'AI that does the boring work',
      body: 'Powered by Claude. Parses natural language, drafts replies, spots patterns — backed by deterministic rules you can trust.',
    },
  ];
  return (
    <section id="features" className="border-b border-border/60 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-muted-foreground">Features</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
            Everything your ops needs. Nothing it doesn't.
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-muted text-foreground">
                  {f.icon}
                </div>
                <h3 className="text-base font-medium">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- How it works ----------------------- */
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Sign up in 60 seconds', body: 'Create your workspace, pick an industry template, and invite your team.' },
    { n: '02', title: 'Connect WhatsApp', body: 'Link your number. We verify it and you\'re ready to assign tasks by message.' },
    { n: '03', title: 'Work the way you already do', body: 'Send a message. We turn it into a task, assign, schedule, and track it.' },
    { n: '04', title: 'Get the full picture', body: 'Daily summaries, weekly recaps, and bottleneck alerts — without lifting a finger.' },
  ];
  return (
    <section id="how" className="border-b border-border/60 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-muted-foreground">How it works</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
            From first message to daily recap, in one week.
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-lg border border-border/60 p-6">
              <p className="font-display text-3xl text-muted-foreground">{s.n}</p>
              <h3 className="mt-3 text-base font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- Use cases ----------------------- */
function UseCases() {
  const cases = [
    { name: 'Sales follow-up', body: 'Never lose a lead. Every hand-raise becomes a tracked follow-up with reminders.' },
    { name: 'Client onboarding', body: 'From kickoff to go-live with stages, SLAs, and approvals built in.' },
    { name: 'Service delivery', body: 'Track every service request from receipt to QA and delivery.' },
    { name: 'Invoice follow-up', body: 'Automated nudges until invoices are paid. See who owes what at a glance.' },
    { name: 'Support tickets', body: 'Route requests, track SLAs, keep customers informed.' },
    { name: 'Approvals', body: 'Fast decisions with a clear trail — no more chasing signatures.' },
  ];
  return (
    <section className="border-b border-border/60 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-muted-foreground">Use cases</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
            Works on day one. Grows with your business.
          </h2>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {cases.map((c) => (
            <div key={c.name} className="bg-card p-6">
              <h3 className="text-base font-medium">{c.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- Pricing ----------------------- */
function Pricing() {
  const plans = [
    { ...PLANS.STARTER, features: ['Up to 5 users', '500 tasks / month', 'WhatsApp integration', 'Daily summaries', 'Email support'] },
    { ...PLANS.GROWTH, features: ['Up to 20 users', '3,000 tasks / month', 'All workflows', 'Bottleneck detection', 'Priority support'], featured: true },
    { ...PLANS.PRO, features: ['Up to 75 users', 'Unlimited tasks', 'Advanced analytics', 'Custom workflows', 'Dedicated success manager'] },
  ] as const;

  return (
    <section id="pricing" className="border-b border-border/60 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-muted-foreground">Pricing</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">Pay only when you're ready.</h2>
          <p className="mt-3 text-muted-foreground">14-day free trial on every plan. Cancel anytime.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.key}
              className={`relative rounded-xl border p-6 ${
                'featured' in p && p.featured ? 'border-foreground/80' : 'border-border'
              }`}
            >
              {'featured' in p && p.featured ? (
                <span className="absolute -top-3 left-6 rounded-full bg-foreground px-2.5 py-0.5 text-xs text-background">
                  Most popular
                </span>
              ) : null}
              <h3 className="text-base font-medium">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl">
                  ₦{(p.priceMonthlyNGN / 100).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={'featured' in p && p.featured ? 'default' : 'outline'}>
                <Link href="/signup">Start free trial</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Need Enterprise? <Link href="/signup" className="text-foreground underline">Talk to us</Link> for SSO, SLAs, and dedicated onboarding.
        </p>
      </div>
    </section>
  );
}

/* ----------------------- FAQ ----------------------- */
function Faq() {
  const items = [
    { q: 'Do we need to train our team?', a: 'No. Your team keeps using WhatsApp. Admins and managers use the dashboard for setup and visibility.' },
    { q: 'Which WhatsApp does this work with?', a: 'We integrate with the WhatsApp Cloud API (official Meta). Your business number stays yours.' },
    { q: 'Is my data private?', a: 'Yes. Every workspace is fully isolated. Our AI processes messages to help you work — it never trains on your data.' },
    { q: 'Can we start without paying?', a: 'Yes — every plan includes a 14-day free trial with full access.' },
    { q: 'What happens if the AI gets something wrong?', a: 'Every AI action is validated by deterministic rules and shown in the dashboard. You can edit or undo anything.' },
    { q: 'Do you support other African payment methods?', a: 'We use Paystack, which covers most African markets including cards, bank transfers, and mobile money in supported countries.' },
  ];
  return (
    <section id="faq" className="border-b border-border/60 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-muted-foreground">FAQ</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">Common questions</h2>
        </div>
        <div className="mx-auto mt-12 max-w-3xl divide-y divide-border rounded-lg border border-border">
          {items.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                {f.q}
                <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- CTA band ----------------------- */
function CtaBand() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-10 text-center md:p-14">
          <h2 className="font-display text-4xl tracking-tight md:text-5xl">
            From idea to execution to insight.
          </h2>
          <p className="mt-4 text-muted-foreground">
            See what 14 days of focused operations looks like. Free. No credit card.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Start free trial <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
