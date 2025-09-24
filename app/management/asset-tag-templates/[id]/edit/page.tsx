'use client';

import { AssetTagTemplateEditForm } from '@/components/forms/asset-tag-template-edit-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';

export default function EditAssetTagTemplatePage() {
  const params = useParams();
  const id = Number(params.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Asset Tag Template</CardTitle>
        </CardHeader>
        <CardContent>
          {id ? <AssetTagTemplateEditForm templateId={id} /> : <p>Invalid template ID.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
