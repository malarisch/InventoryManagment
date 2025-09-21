import { ManagementFormLoading } from "@/app/management/_libs/management-loading";

export default function Loading() {
  return <ManagementFormLoading showBackLink={false} titleWidthClass="w-56" fieldRows={4} actions={1} />;
}
