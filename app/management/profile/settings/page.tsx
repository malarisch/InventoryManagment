import { ProfileForm } from "@/components/profile-form";
import { UpdatePasswordForm } from "@/components/update-password-form";

export default function ProfileSettingsPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-6">
        <ProfileForm />
        <UpdatePasswordForm />
      </div>
    </main>
  );
}

