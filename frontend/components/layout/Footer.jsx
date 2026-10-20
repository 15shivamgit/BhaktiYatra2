import { BUSINESS } from '@/lib/config';
import { t } from '@/lib/i18n';
import Container from './Container';

/** Phase 1 footer with business contact details; full link columns arrive in Phase 3. */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <Container className="flex flex-col gap-4 py-8 text-sm text-text-muted md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-xl font-semibold text-accent">{BUSINESS.name}</p>
          <p className="mt-1">{t('site.tagline')}</p>
        </div>
        <address className="not-italic">
          <p className="font-semibold text-text">{t('footer.contactHeading')}</p>
          <p>{BUSINESS.address}</p>
          <p>
            <a className="hover:text-primary" href={BUSINESS.phoneHref}>
              {BUSINESS.phoneDisplay}
            </a>
            {' · '}
            <a className="hover:text-primary" href={`mailto:${BUSINESS.email}`}>
              {BUSINESS.email}
            </a>
          </p>
        </address>
      </Container>
      <Container className="border-t border-border py-4 text-xs text-text-muted">
        © {BUSINESS.name}. {t('footer.rights')}
      </Container>
    </footer>
  );
}
