import { ManagementDetailLoading } from "@/app/management/_libs/management-loading";

export default function Loading() {
  return <ManagementDetailLoading heading="Case" hint="Case-Details werden geladen …" sections={4} />;
}
