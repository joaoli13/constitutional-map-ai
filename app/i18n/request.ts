import {getRequestConfig} from "next-intl/server";

import {routing, type AppLocale} from "@/i18n/routing";

export default getRequestConfig(async ({requestLocale}) => {
  const requestedLocale = await requestLocale;
  const locale: AppLocale =
    requestedLocale && routing.locales.includes(requestedLocale as never)
      ? (requestedLocale as AppLocale)
      : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
