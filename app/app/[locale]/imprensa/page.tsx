import OfficialProjectInfoRoute, {
  generateOfficialProjectInfoMetadata,
  type OfficialProjectInfoRouteProps,
} from "../(official)/OfficialProjectInfoRoute";

export function generateStaticParams() {
  return [{locale: "pt"}];
}

export function generateMetadata(props: OfficialProjectInfoRouteProps) {
  return generateOfficialProjectInfoMetadata(props, "imprensa");
}

export default function ImprensaPage(props: OfficialProjectInfoRouteProps) {
  return OfficialProjectInfoRoute({...props, expectedSlug: "imprensa"});
}
