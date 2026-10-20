import Container from '@/components/layout/Container';

/**
 * Centred card used by every auth page.
 * @param {{ title: string, subtitle?: string, children: React.ReactNode, footer?: React.ReactNode }} props
 */
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <Container size="narrow" className="flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
          <h1 className="text-3xl text-accent sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-text-muted">{subtitle}</p>}
          <span aria-hidden="true" className="mt-5 block h-px w-16 bg-gold" />
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-text-muted">{footer}</div>}
      </div>
    </Container>
  );
}
