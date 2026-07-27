import { notFound } from "next/navigation";
import { ShareViewer } from "@/components/ShareViewer";
import { getShare, toPublicShare } from "@/lib/store";

type Props = { params: Promise<{ id: string }> };

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const share = await getShare(id);
  if (!share) notFound();

  return <ShareViewer initialShare={toPublicShare(share)} />;
}
