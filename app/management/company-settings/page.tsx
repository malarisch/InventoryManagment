import { CompanySettingsForm } from "@/components/company-settings-form";
import { AssetTagTemplatesSection } from "@/components/asset-tag-templates-section";
import { CompanyFiles } from "@/components/forms/partials/company-files";

export default function CompanySettingsPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 space-y-6">
        <CompanySettingsForm />
        <CompanyFiles />
        <AssetTagTemplatesSection />
      </div>
    </main>
  );
}
