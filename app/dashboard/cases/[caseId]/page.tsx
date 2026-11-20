import { Suspense } from "react";
import { CaseDetailView } from "@/features/dashboard";

// Demo case ids from the synthetic seed (c1 … c34) are prerendered.
export function generateStaticParams() {
  return Array.from({ length: 34 }, (_, i) => ({ caseId: `c${i + 1}` }));
}

async function CaseDetail({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <CaseDetailView caseId={caseId} />;
}

export default function Page({ params }: { params: Promise<{ caseId: string }> }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-steel-500">Loading case…</div>}>
      <CaseDetail params={params} />
    </Suspense>
  );
}
