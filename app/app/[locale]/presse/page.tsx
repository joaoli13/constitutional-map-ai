import OfficialProjectInfoRoute, {
  generateOfficialProjectInfoMetadata,
  type OfficialProjectInfoRouteProps,
} from "../(official)/OfficialProjectInfoRoute";

export function generateStaticParams() {
  return [{locale: "fr"}];
}

export function generateMetadata(props: OfficialProjectInfoRouteProps) {
  return generateOfficialProjectInfoMetadata(props, "presse");
}

export default function PressePage(props: OfficialProjectInfoRouteProps) {
  return OfficialProjectInfoRoute({...props, expectedSlug: "presse"});
}
