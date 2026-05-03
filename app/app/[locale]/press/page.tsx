import OfficialProjectInfoRoute, {
  generateOfficialProjectInfoMetadata,
  type OfficialProjectInfoRouteProps,
} from "../(official)/OfficialProjectInfoRoute";

export function generateStaticParams() {
  return [{locale: "en"}, {locale: "ja"}, {locale: "zh"}];
}

export function generateMetadata(props: OfficialProjectInfoRouteProps) {
  return generateOfficialProjectInfoMetadata(props, "press");
}

export default function PressPage(props: OfficialProjectInfoRouteProps) {
  return OfficialProjectInfoRoute({...props, expectedSlug: "press"});
}
