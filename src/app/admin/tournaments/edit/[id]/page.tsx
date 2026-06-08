"use client";

import { use } from "react";
import TournamentForm from "@/components/tournaments/TournamentForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function EditTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Edit Turnamen" paths={[{ name: "Turnamen", href: "/admin/tournaments" }]} />
      <TournamentForm tournamentId={id} />
    </div>
  );
}
