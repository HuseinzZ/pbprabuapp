import {
  buildPointEntries,
  type MatchRow,
  type TeamRow,
  type PlayerRow,
  type PointConfig
} from "@/lib/utils/point-system";
import { toast } from "react-toastify";

/**
 * Automagically distribute points to players when a tournament finishes.
 * Returns true if points were distributed, false if already distributed or not ready.
 */
export async function autoDistributePoints(supabase: any, tournamentId: string, matchId: string, force: boolean = false): Promise<boolean> {
  try {
    // 1. Check if points already distributed
    const { data: existingPoints } = await supabase
      .from("point_histories")
      .select("id")
      .eq("tournament_id", tournamentId)
      .limit(1);

    if (existingPoints && existingPoints.length > 0) {
      if (!force) {
        // Points already distributed
        return false;
      }
      // If force is true, we delete the existing points for this tournament
      const { error: delErr } = await supabase
        .from("point_histories")
        .delete()
        .eq("tournament_id", tournamentId);
        
      if (delErr) {
        console.error("Failed to delete existing points:", delErr);
        toast.error("Gagal menghapus poin lama: " + delErr.message);
        return false;
      }
    }

    // 2. Fetch tournament and point config
    const { data: tourData } = await supabase
      .from("tournaments")
      .select("*, points(*)")
      .eq("id", tournamentId)
      .single();

    if (!tourData || !tourData.points) {
      return false; // No point config
    }
    const pointConfig = tourData.points as PointConfig;

    // 3. Fetch all matches, teams, players
    const { data: matchesData } = await supabase
      .from("matches")
      .select("id, phase, group_name, team1_id, team2_id, score_team1, score_team2, winner_team_id, status, is_bye")
      .eq("tournament_id", tournamentId);
    
    const { data: teamsData } = await supabase
      .from("teams")
      .select("id, name, player1_id, player2_id, group_name, is_bye_team")
      .eq("tournament_id", tournamentId);

    const matches = (matchesData ?? []) as MatchRow[];
    const teams = (teamsData ?? []) as TeamRow[];

    // 4. Check if tournament is decided (has finished Final)
    const hasFinal = matches.some((m) => m.phase === "F" && m.status === "completed");
    
    const isDecided = hasFinal;
    if (!isDecided && !force) return false;

    // 5. Fetch Players
    const playerIds = [
      ...new Set([
        ...teams.map((t) => t.player1_id),
        ...teams.map((t) => t.player2_id),
      ].filter(Boolean) as string[]),
    ];
    if (playerIds.length === 0) return false;

    const { data: playersData } = await supabase
      .from("profile")
      .select("id, fullname, username, avatar_url, ranking_points")
      .in("id", playerIds);

    const playerMap: Record<string, PlayerRow> = {};
    (playersData ?? []).forEach((p: PlayerRow) => { playerMap[p.id] = p; });

    // 6. Build Point Entries
    const entries = buildPointEntries(matches, teams, playerMap, pointConfig, force);
    if (entries.length === 0) return false;

    // 7. Insert Point Histories and Update Players
    const historyInserts = [];
    
    for (const entry of entries) {
      if (entry.points > 0) {
        // Add history row
        historyInserts.push({
          player_id: entry.playerId,
          tournament_id: tournamentId,
          match_id: matchId,
          phase_achieved: entry.tier,
          points_earned: entry.points,
          points_before: 0,
          points_after: 0,
          notes: `Lolos sebagai ${entry.tier}`,
        });
      }
    }

    if (historyInserts.length > 0) {
      const { error: insErr } = await supabase.from("point_histories").insert(historyInserts);
      if (insErr) {
        console.error("Insert histories error:", insErr);
        toast.error("Gagal menyimpan riwayat poin: " + insErr.message);
        return false;
      }
      
      // Since we just modified point_histories, we must sync all player points to be accurate
      await syncAllPlayerPoints(supabase);
      
      toast.success(`Poin turnamen otomatis dibagikan ke ${historyInserts.length} pemain!`);
    }

    return true;

  } catch (error) {
    console.error("Failed to distribute points automatically", error);
    return false;
  }
}

/**
 * Recalculate and synchronize ranking_points for all players from point_histories
 * Returns true if successful, false otherwise.
 */
export async function syncAllPlayerPoints(supabase: any, silent: boolean = false): Promise<boolean> {
  try {
    // 1. Get sum of points_earned for each player from point_histories
    const { data: histories, error: hErr } = await supabase
      .from("point_histories")
      .select("player_id, points_earned");

    if (hErr) {
      console.error("Failed to fetch point histories:", hErr);
      if (!silent) toast.error("Gagal mengambil riwayat poin: " + hErr.message);
      return false;
    }

    const totals: Record<string, number> = {};
    for (const h of (histories || [])) {
      if (!totals[h.player_id]) totals[h.player_id] = 0;
      totals[h.player_id] += h.points_earned;
    }

    // 2. Get all players to update their points if there is a mismatch
    const { data: players, error: pErr } = await supabase
      .from("profile")
      .select("id, ranking_points");

    if (pErr) {
      console.error("Failed to fetch players:", pErr);
      if (!silent) toast.error("Gagal mengambil data pemain: " + pErr.message);
      return false;
    }

    // 3. Prepare updates for players with mismatched points
    const updateTasks: (() => Promise<any>)[] = [];
    for (const p of (players || [])) {
      const correctPoints = totals[p.id] || 0;
      if (p.ranking_points !== correctPoints) {
        const playerId = p.id;
        updateTasks.push(async () => {
          await supabase
            .from("profile")
            .update({ ranking_points: correctPoints })
            .eq("id", playerId);
        });
      }
    }

    if (updateTasks.length > 0) {
      // Execute all updates
      await Promise.all(updateTasks.map((fn) => fn()));
      console.log(`Synchronized points for ${updateTasks.length} players.`);
    }

    // 4. Update player global rankings (JS equivalent of RPC)
    try {
      const { data: allProfiles, error: fetchErr } = await supabase
        .from("profile")
        .select("id, ranking_points, ranking_position")
        .order("ranking_points", { ascending: false });

      if (fetchErr) throw fetchErr;

      if (allProfiles) {
        let currentRank = 1;
        let previousPoints = -1;
        let actualPosition = 1;
        
        const rankUpdateTasks: (() => Promise<any>)[] = [];

        for (let i = 0; i < allProfiles.length; i++) {
          const profile = allProfiles[i];
          const points = profile.ranking_points || 0;

          if (points !== previousPoints) {
            currentRank = actualPosition;
            previousPoints = points;
          }

          if (profile.ranking_position !== currentRank) {
            const profileId = profile.id;
            const newRank = currentRank;
            rankUpdateTasks.push(async () => {
              await supabase
                .from("profile")
                .update({ ranking_position: newRank })
                .eq("id", profileId);
            });
          }
          
          actualPosition++;
        }

        if (rankUpdateTasks.length > 0) {
          await Promise.all(rankUpdateTasks.map((fn) => fn()));
          console.log(`Updated rankings for ${rankUpdateTasks.length} players.`);
        }
      }
    } catch (rankErr: any) {
      console.error("Error updating rankings in JS:", rankErr);
      if (!silent) toast.error("Gagal memperbarui peringkat pemain: " + rankErr.message);
      return false;
    }

    if (!silent) toast.success(`Berhasil mensinkronisasi poin untuk semua pemain!`);
    return true;
  } catch (error) {
    console.error("Failed to sync all player points", error);
    toast.error("Terjadi kesalahan saat sinkronisasi poin.");
    return false;
  }
}
