import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AuraHomeView from "@/components/users/AuraHomeView";
import SponsorSection from "@/components/users/SponsorSection";

export const metadata: Metadata = {
  title: "PB Prabu Bandung – Portal Komunitas Badminton",
  description:
    "Portal resmi komunitas badminton PB Prabu Bandung. Daftar, ikuti turnamen, pantau ranking, jadwal pertandingan, dan nikmati galeri kegiatan komunitas.",
  openGraph: {
    title: "PB Prabu Bandung – Portal Komunitas Badminton",
    description: "Portal resmi komunitas badminton PB Prabu Bandung.",
    type: "website",
  },
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch Stats in parallel
  const [
    playersRes,
    matchesRes,
    { data: tournaments },
    { data: matches },
    { data: allTournaments }
  ] = await Promise.all([
    supabase.from("profile").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("tournaments").select("id, name, status, location, start_date, max_participants, prize_pool, entry_fee").in("status", ["upcoming", "ongoing"]).order("start_date", { ascending: true }),
    supabase.from("matches").select("id, match_date, team1_score, team2_score, status, tournament_id, tournaments(name)").eq("status", "completed").order("match_date", { ascending: false }).limit(4),
    supabase.from("tournaments").select("prize_pool")
  ]);

  const totalPrizePool = allTournaments?.reduce((sum, t) => sum + (Number(t.prize_pool) || 0), 0) || 0;

  const stats = {
    players: playersRes.count || 0,
    prizePool: totalPrizePool,
    activeMatches: matchesRes.count || 0,
  };

  return (
    <main className="page-fade-in bg-white dark:bg-[#09090b] min-h-screen">
      <AuraHomeView 
        tournaments={tournaments || []} 
        matches={(matches as any) || []} 
        stats={stats} 
        isAuthenticated={!!user}
      />
      
      {/* 6. Sponsor strip */}
      <SponsorSection />
    </main>
  );
}
