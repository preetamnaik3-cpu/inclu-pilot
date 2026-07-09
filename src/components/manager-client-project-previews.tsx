import { ManagerClientProjectList } from "@/components/manager-client-project-list";
import { enrichManagerClientSummaries } from "@/lib/queries";
import type { ManagerClientSummary } from "@/lib/types";

export async function ManagerClientProjectPreviews({
  summaries,
}: {
  summaries: ManagerClientSummary[];
}) {
  const clients = await enrichManagerClientSummaries(summaries);
  return <ManagerClientProjectList clients={clients} />;
}
