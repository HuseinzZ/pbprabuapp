"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import GroupStandingsTable from "@/components/matches/GroupStandingsTable";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/shared/Loader";
import StandingsFilters from "@/components/matches/StandingsFilters";
import { computeGroupStandings, isGroupRRComplete } from "@/lib/utils/knockout-engine";

function StandingsContent() {
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<{ id: string; name: string; start_date: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("id, name, start_date, created_at")
      .order("start_date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTournaments(data ?? []);
        if (data && data.length > 0) {
          setSelectedTournament(data[0].id);
          if (data[0].start_date) {
            setSelectedDate(data[0].start_date.split('T')[0]);
          }
        } else {
          setLoading(false);
        }
      });
  }, [supabase]);

  useEffect(() => {
    let tIds: string[] = [];

    if (selectedTournament !== "all") {
      tIds = [selectedTournament];
    } else if (selectedDate) {
      tIds = tournaments
        .filter(t => t.start_date && t.start_date.startsWith(selectedDate))
        .map(t => t.id);
    }

    if (tIds.length === 0) {
      setMatches([]);
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      supabase.from("matches").select("*").in("tournament_id", tIds),
      supabase.from("teams").select("*").in("tournament_id", tIds)
    ]).then(([{ data: mData }, { data: tData }]) => {
      setMatches(mData ?? []);
      setTeams(tData ?? []);
      setLoading(false);
      setSelectedGroup("all"); // Reset group filter when data changes
    });
  }, [selectedDate, selectedTournament, tournaments, supabase]);

  const standingsByTournamentGroup = useMemo(() => {
    const result: Record<string, Record<string, any[]>> = {};
    const tIds = [...new Set(matches.map(m => m.tournament_id))];

    for (const tId of tIds) {
      if (!tId) continue;
      const tMatches = matches.filter(m => m.tournament_id === tId);
      const tTeams = teams.filter(t => t.tournament_id === tId);
      
      const st = computeGroupStandings(tMatches, tTeams);
      if (Object.keys(st).length === 0) continue;

      const tObj = tournaments.find(x => x.id === tId);
      const tName = tObj ? tObj.name : "Turnamen Tidak Diketahui";
      
      result[tName] = st;
    }

    return result;
  }, [matches, teams, tournaments]);

  const groupKeys = useMemo(() => {
    const keys = new Set<string>();
    Object.values(standingsByTournamentGroup).forEach(groups => {
      Object.keys(groups).forEach(g => keys.add(g));
    });
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [standingsByTournamentGroup]);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Klasemen Grup" />
      
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col">
        <StandingsFilters
          search={searchQuery}
          setSearch={setSearchQuery}
          group={selectedGroup}
          setGroup={setSelectedGroup}
          groups={groupKeys}
          tournamentDate={selectedDate}
          setTournamentDate={setSelectedDate}
          tournamentId={selectedTournament}
          setTournamentId={setSelectedTournament}
          tournaments={tournaments.filter(t => !selectedDate || (t.start_date && t.start_date.startsWith(selectedDate)))}
        />

      {loading ? (
        <div className="flex justify-center p-10"><Loader /></div>
      ) : Object.keys(standingsByTournamentGroup).length === 0 ? (
        <div className="overflow-hidden rounded-b-xl border-t border-gray-200 bg-white dark:bg-white/[0.03]">
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-sm font-medium">Tidak ada data klasemen</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10 p-6">
          {Object.entries(standingsByTournamentGroup).sort(([a], [b]) => a.localeCompare(b)).map(([tName, groups]) => {
            const filteredGroups = Object.entries(groups)
              .filter(([groupName]) => selectedGroup === "all" || groupName === selectedGroup)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([groupName, standings]) => {
                let filteredStandings = standings;
                if (searchQuery) {
                  const q = searchQuery.toLowerCase();
                  filteredStandings = standings.filter(s => 
                    s.teamName?.toLowerCase().includes(q) || 
                    groupName.toLowerCase().includes(q)
                  );
                }
                return { groupName, standings: filteredStandings };
              })
              .filter(g => g.standings.length > 0);

            if (filteredGroups.length === 0) return null;

            return (
              <div key={tName} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1.5 bg-brand-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{tName}</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredGroups.map(({ groupName, standings }) => {
                    const tId = tournaments.find(t => t.name === tName)?.id;
                    const tMatches = matches.filter(m => m.tournament_id === tId);
                    const allComplete = isGroupRRComplete(tMatches, groupName);
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
              </div>
            );
          })}
        </div>
      )}
      </div>
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
