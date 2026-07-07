import { redirect } from "next/navigation";

export default async function ClientWorkDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/client/activities/${id}`);
}
