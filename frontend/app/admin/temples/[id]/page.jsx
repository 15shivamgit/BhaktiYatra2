import { Suspense } from 'react';
import TempleEditor from '@/components/admin/temples/TempleEditor';
import { t } from '@/lib/i18n';

export const metadata = { title: 'Edit temple' };

async function Editor({ params }) {
  const { id } = await params;
  return <TempleEditor id={id} />;
}

/** params are request data, so they are read inside <Suspense> (Cache Components). */
export default function EditTemplePage({ params }) {
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
