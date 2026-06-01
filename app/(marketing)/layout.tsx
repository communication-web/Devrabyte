import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-medium tracking-tight">Devrabyte</span>
            <span className="text-muted-foreground/60">/</span>
            <span className="text-sm text-muted-foreground">AI Ops</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <Link href="/#features" className="hover:text-foreground">Features</Link>
            <Link href="/#how" className="hover:text-foreground">How it works</Link>
            <Link href="/#pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/#faq" className="hover:text-foreground">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col items-start justify-between gap-6 text-sm text-muted-foreground md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Logo />
            <span>Devrabyte AI Ops</span>
            <span className="text-muted-foreground/60">— From idea to execution to insight.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/#features" className="hover:text-foreground">Features</Link>
            <Link href="/#pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div className="relative flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
      <span className="text-[10px] font-semibold leading-none">D</span>
    </div>
  );
}
