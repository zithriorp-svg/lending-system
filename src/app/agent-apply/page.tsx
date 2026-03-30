import { Suspense } from "react";
import AgentApplyClient from "./AgentApplyClient";

export const dynamic = "force-dynamic";

export default function AgentApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Loading Agent Portal...</div>
      </div>
    }>
      <AgentApplyClient />
    </Suspense>
  );
}
