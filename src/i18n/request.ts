import { getRequestConfig } from "next-intl/server";
import { getLocale, getMessages } from "@/lib/locale-server";

export default getRequestConfig(async () => {
  const locale = getLocale();

  return {
    locale,
    messages: getMessages(locale),
    timeZone: "America/Sao_Paulo",
  };
});
