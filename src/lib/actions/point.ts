import {
  buildPointEntries,
  type MatchRow,
  type TeamRow,
  type PlayerRow,
  type TournamentTypeConfig
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
      .select("*, tournament_types(*)")
      .eq("id", tournamentId)
      .single();

    if (!tourData || !tourData.tournament_types) {
      return false; // No point config
    }
    const pointConfig = tourData.tournament_types as TournamentTypeConfig;

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

    // 4. Check if tournament is decided (has finished Final or all RR finished)
    const hasFinal = matches.some((m) => m.phase === "F" && m.status === "completed");
    const activeTeams = teams.filter((t) => !t.is_bye_team);
    const groups = [...new Set(activeTeams.map((t) => t.group_name).filter(Boolean) as string[])];
    
    const allRRComplete = groups.length > 0 && groups.every((g) => {
      const rrMatches = matches.filter((m) => (m.phase === "RR" || !m.phase) && m.group_name === g && !m.is_bye);
      return rrMatches.length > 0 && rrMatches.every((m) => m.status === "completed");
    });

    const isDecided = hasFinal || allRRComplete;
    if (!isDecided) return false;

    // 5. Fetch Players
    const playerIds = [
      ...new Set([
        ...teams.map((t) => t.player1_id),
        ...teams.map((t) => t.player2_id),
      ].filter(Boolean) as string[]),
    ];
    if (playerIds.length === 0) return false;

    const { data: playersData } = await supabase
      .from("players")
      .select("id, full_name, nickname, avatar_url, ranking_points")
      .in("id", playerIds);

    const playerMap: Record<string, PlayerRow> = {};
    (playersData ?? []).forEach((p: PlayerRow) => { playerMap[p.id] = p; });

    // 6. Build Point Entries
    const entries = buildPointEntries(matches, teams, playerMap, pointConfig);
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
export async function syncAllPlayerPoints(supabase: any): Promise<boolean> {
  try {
    // 1. Get sum of points_earned for each player from point_histories
    const { data: histories, error: hErr } = await supabase
      .from("point_histories")
      .select("player_id, points_earned");

    if (hErr) {
      console.error("Failed to fetch point histories:", hErr);
      toast.error("Gagal mengambil riwayat poin: " + hErr.message);
      return false;
    }

    const totals: Record<string, number> = {};
    for (const h of (histories || [])) {
      if (!totals[h.player_id]) totals[h.player_id] = 0;
      totals[h.player_id] += h.points_earned;
    }

    // 2. Get all players to update their points if there is a mismatch
    const { data: players, error: pErr } = await supabase
      .from("players")
      .select("id, ranking_points");

    if (pErr) {
      console.error("Failed to fetch players:", pErr);
      toast.error("Gagal mengambil data pemain: " + pErr.message);
      return false;
    }

    // 3. Prepare updates for players with mismatched points
    const updates = [];
    for (const p of (players || [])) {
      const correctPoints = totals[p.id] || 0;
      if (p.ranking_points !== correctPoints) {
        updates.push(
          supabase
            .from("players")
            .update({ ranking_points: correctPoints })
            .eq("id", p.id)
        );
      }
    }

    if (updates.length > 0) {
      // Execute all updates
      await Promise.all(updates);
      console.log(`Synchronized points for ${updates.length} players.`);
    }

    // 4. Update player global rankings
    const { error: rpcErr } = await supabase.rpc("update_player_rankings");
    if (rpcErr) {
      console.error("RPC error updating rankings:", rpcErr);
      toast.error("Gagal memperbarui peringkat pemain: " + rpcErr.message);
      return false;
    }

    toast.success(`Berhasil mensinkronisasi poin untuk semua pemain!`);
    return true;
  } catch (error) {
    console.error("Failed to sync all player points", error);
    toast.error("Terjadi kesalahan saat sinkronisasi poin.");
    return false;
  }
}
