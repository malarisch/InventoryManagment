
import { AssetTagTemplateCreateForm } from '@/components/forms/asset-tag-template-create-form';

export default function NewAssetTagTemplatePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Create Asset Tag Template</h1>
      <AssetTagTemplateCreateForm />
    </div>
  );
}
