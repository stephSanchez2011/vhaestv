import { ShareViewer } from "@/components/ShareViewer";
import { getShare, toPublicShare } from "@/lib/store";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function SharePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { t } = await searchParams;
  const share = await getShare(id);
  if (!share) notFound();

  return (
    <ShareViewer
      initialShare={toPublicShare(share)}
      initialTrainerToken={t || ""}
    />
  );
}
