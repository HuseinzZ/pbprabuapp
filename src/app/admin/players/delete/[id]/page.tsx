"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DeletePlayerModal from "@/components/players/DeletePlayerModal";
import { Player } from "@/app/admin/players/types";
import Loader from "@/components/shared/Loader";
import { deleteStorageFile } from "@/lib/utils/storage";

export default function DeletePlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setPlayer(data as Player);
        setLoading(false);
      });
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus pemain: " + error.message);
      setDeleting(false);
      return;
    }
    if (player?.avatar_url) {
      await deleteStorageFile(player.avatar_url, "avatars");
    }
    router.push("/admin/players");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <DeletePlayerModal
      isOpen={true}
      onClose={() => router.push("/admin/players")}
      onConfirm={handleDelete}
      player={player}
      isDeleting={deleting}
    />
  );
}
