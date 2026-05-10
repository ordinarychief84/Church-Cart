import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { ROLE_HOME } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContactForm } from "./ContactForm";
import { PasswordForm } from "./PasswordForm";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Account"
        description="Update how we reach you and change your password."
        action={
          <Link
            href={ROLE_HOME[user.role]}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Dashboard
          </Link>
        }
      />
      <div className="grid gap-6">
        <ContactForm
          initial={{
            fullName: user.fullName,
            email: user.email ?? "",
            phone: user.phone ?? "",
          }}
        />
        <PasswordForm />
      </div>
    </div>
  );
}
