import { redirect } from "next/navigation";

export default function ClientWorkRedirect() {
  redirect("/client/activities");
}
