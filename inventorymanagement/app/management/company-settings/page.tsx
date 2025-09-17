import { CompanySettingsForm } from "@/components/company-settings-form";

export default function CompanySettingsPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-6">
        <CompanySettingsForm />
      </div>
    </main>
  );
}
