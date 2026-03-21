import {redirect} from "next/navigation";

type Props = Readonly<{params: Promise<{id: string}>}>;

export default async function ShareRedirect({params}: Props) {
  const {id} = await params;
  redirect(`/en/share/${id}`);
}
