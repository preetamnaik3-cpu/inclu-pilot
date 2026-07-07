import { redirect } from "next/navigation";

export default function ManagerInboxRedirect() {
  redirect("/manager/chat");
}
