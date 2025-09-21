import { ManagementDetailLoading } from "@/app/management/_libs/management-loading";

export default function Loading() {
  return <ManagementDetailLoading heading="Job" hint="Jobdetails werden geladen …" sections={4} />;
}
