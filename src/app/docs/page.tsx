import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/** Rota antiga da landing. Manda para comunidades. */
export default function DocsRedirect() {
  redirect(routes.communities);
}
