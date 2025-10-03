'use client';

import { AssetTagTemplateForm } from '@/components/forms/asset-tag-template-form';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditAssetTagTemplatePage() {
  const params = useParams();
  const id = Number(params.id);

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/company-settings?tab=templates" className="hover:underline">← Zurück zu Company Settings</Link>
        </div>
        <h1 className="text-2xl font-semibold">Edit Asset Tag Template</h1>
        {id ? <AssetTagTemplateForm templateId={id} /> : <p className="text-red-600">Invalid template ID.</p>}
      </div>
    </main>
  );
}
