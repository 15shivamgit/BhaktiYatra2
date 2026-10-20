import { Suspense } from 'react';
import CircuitEditor from '@/components/admin/circuits/CircuitEditor';
import { t } from '@/lib/i18n';

export const metadata = { title: 'Edit circuit' };

async function Editor({ params }) {
  const { id } = await params;
  return <CircuitEditor id={id} />;
}

/** params are request data, so they are read inside <Suspense> (Cache Components). */
export default function EditCircuitPage({ params }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-sm text-text-muted">
          {t('adminContent.loading')}
        </p>
      }
    >
      <Editor params={params} />
    </Suspense>
  );
}
