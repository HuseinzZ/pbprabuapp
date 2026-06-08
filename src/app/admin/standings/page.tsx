"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import GroupStandingsTable from "@/components/matches/GroupStandingsTable";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/shared/Loader";
import { computeGroupStandings, isGroupRRComplete } from "@/lib/utils/knockout-engine";

function StandingsContent() {
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("id, name")
      .order("start_date", { ascending: false })
      .then(({ data }) => {
        setTournaments(data ?? []);
        if (data && data.length > 0) {
          setSelectedTournament(data[0].id);
        } else {
          setLoading(false);
        }
      });
  }, [supabase]);

  useEffect(() => {
    if (!selectedTournament) return;
    setLoading(true);
    Promise.all([
      supabase.from("matches").select("*").eq("tournament_id", selectedTournament),
      supabase.from("teams").select("*").eq("tournament_id", selectedTournament)
    ]).then(([{ data: mData }, { data: tData }]) => {
      setMatches(mData ?? []);
      setTeams(tData ?? []);
      setLoading(false);
    });
  }, [selectedTournament, supabase]);

  const standingsByGroup = useMemo(() => {
    return computeGroupStandings(matches, teams);
  }, [matches, teams]);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Klasemen Grup" />
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Pilih Turnamen
        </label>
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500/30"
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader /></div>
      ) : Object.keys(standingsByGroup).length === 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-white/[0.03]">
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-sm font-medium">Tidak ada data klasemen</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(standingsByGroup)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupName, standings]) => {
              const allComplete = isGroupRRComplete(matches, groupName);
              return (
                <GroupStandingsTable
                  key={groupName}
                  groupName={groupName}
                  standings={standings}
                  allComplete={allComplete}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}

export default function StandingsPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <StandingsContent />
    </Suspense>
  );
}
