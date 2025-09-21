import { ManagementDetailLoading } from "@/app/management/_libs/management-loading";

export default function Loading() {
  return <ManagementDetailLoading heading="Location" hint="Standortdetails werden geladen …" sections={2} />;
}
