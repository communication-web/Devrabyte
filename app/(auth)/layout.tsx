import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-card p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2 text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-[10px] font-semibold">D</span>
          </span>
          <span className="font-medium">Devrabyte</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">AI Ops</span>
        </Link>
        <div className="max-w-md">
          <p className="font-display text-4xl leading-tight">
            From idea to execution to insight — without the chaos.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Built for the way African SMEs already work. Your team keeps WhatsApp. You get
            structure, visibility, and AI that does the boring parts.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          © Devrabyte. Built with care for operators.
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
