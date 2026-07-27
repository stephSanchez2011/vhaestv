import { Suspense } from "react";
import { notFound } from "next/navigation";
import { EditShareClient } from "@/components/EditShareClient";
import { getShare, toPublicShare } from "@/lib/store";

type Props = { params: Promise<{ id: string }> };

export default async function EditPage({ params }: Props) {
  const { id } = await params;
  const share = await getShare(id);
  if (!share) notFound();

  return (
    <Suspense fallback={<div className="pt-6">Chargement…</div>}>
      <EditShareClient shareId={id} initialShare={toPublicShare(share)} />
    </Suspense>
  );
}
