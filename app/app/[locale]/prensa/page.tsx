import OfficialProjectInfoRoute, {
  generateOfficialProjectInfoMetadata,
  type OfficialProjectInfoRouteProps,
} from "../(official)/OfficialProjectInfoRoute";

export function generateStaticParams() {
  return [{locale: "es"}];
}

export function generateMetadata(props: OfficialProjectInfoRouteProps) {
  return generateOfficialProjectInfoMetadata(props, "prensa");
}

export default function PrensaPage(props: OfficialProjectInfoRouteProps) {
  return OfficialProjectInfoRoute({...props, expectedSlug: "prensa"});
}
