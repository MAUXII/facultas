import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/** Home pública (sem auth) — redirect HTTP pra o Google Site Verifier achar o meta. */
export default function Home() {
  redirect(routes.discover);
}
