import Link from 'next/link';
import { AssetTagTemplateCreateForm } from '@/components/forms/asset-tag-template-create-form';

export default function NewAssetTagTemplatePage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/company-settings?tab=templates" className="hover:underline">← Zurück zu Company Settings</Link>
        </div>
        <h1 className="text-2xl font-semibold">Create Asset Tag Template</h1>
        <AssetTagTemplateCreateForm />
      </div>
    </main>
  );
}
