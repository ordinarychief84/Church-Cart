import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export function DashboardPanel({
  title,
  subtitle,
  href,
  hrefLabel = "View all",
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {href && (
            <Link
              href={href}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
            >
              {hrefLabel} <ArrowUpRight size={12} />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardBody className="p-0">{children}</CardBody>
    </Card>
  );
}

export function PanelEmpty({ message }: { message: string }) {
  return <p className="px-4 py-6 text-center text-sm text-slate-500">{message}</p>;
}

export function PanelList({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-slate-200">{children}</ul>;
}

export function PanelRow({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  if (href) {
    return (
      <li>
        <Link href={href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-slate-50">
          {children}
        </Link>
      </li>
    );
  }
  return <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">{children}</li>;
}
