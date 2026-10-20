import { Suspense } from 'react';
import TourEditor from '@/components/admin/tours/TourEditor';
import { t } from '@/lib/i18n';

export const metadata = { title: 'Edit tour' };

async function Editor({ params }) {
  const { id } = await params;
  return <TourEditor id={id} />;
}

/** params are request data, so they are read inside <Suspense> (Cache Components). */
export default function EditTourPage({ params }) {
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
