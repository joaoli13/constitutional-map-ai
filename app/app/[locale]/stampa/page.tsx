import OfficialProjectInfoRoute, {
  generateOfficialProjectInfoMetadata,
  type OfficialProjectInfoRouteProps,
} from "../(official)/OfficialProjectInfoRoute";

export function generateStaticParams() {
  return [{locale: "it"}];
}

export function generateMetadata(props: OfficialProjectInfoRouteProps) {
  return generateOfficialProjectInfoMetadata(props, "stampa");
}

export default function StampaPage(props: OfficialProjectInfoRouteProps) {
  return OfficialProjectInfoRoute({...props, expectedSlug: "stampa"});
}
