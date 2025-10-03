import { ManagementDetailLoading } from "@/app/management/_libs/management-loading";

export default function Loading() {
  return <ManagementDetailLoading heading="Customer" hint="Kundendetails werden geladen …" sections={4} />;
}
