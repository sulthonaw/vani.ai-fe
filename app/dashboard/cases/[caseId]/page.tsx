import type { Metadata } from "next";
import { Suspense } from "react";
import { CaseDetailView } from "@/features/dashboard";

// Demo case ids from the synthetic seed (c1 … c10) are prerendered.
export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ caseId: `c${i + 1}` }));
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

// The dashboard renders on the client (demo state lives in localStorage), so opt out of instant-navigation validation.
export const instant = false;


export const metadata: Metadata = { title: "Case" };
