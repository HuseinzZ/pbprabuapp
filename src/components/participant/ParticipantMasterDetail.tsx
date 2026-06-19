"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Trophy, Users, Search, Plus, Trash2, Pencil, 
  FileSpreadsheet, AlertTriangle, Clock, Mail, 
  SlidersHorizontal, RefreshCw, CheckCircle2, Download
} from 'lucide-react';
import { Participant } from '@/app/admin/participant/types';
import { Tournament, TournamentStatus, STATUS_CONFIG as TRN_STATUS_CONFIG } from '@/app/admin/tournaments/types';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { createClient } from '@/lib/supabase/client';
import DeleteParticipantModal from './DeleteParticipantModal';

interface Props {
  tournaments: Tournament[];
  participants: Participant[];
  fetchParticipants: () => void;
  onAddLog: (action: string, type: string) => void;
}

export default function ParticipantMasterDetail({ tournaments, participants, fetchParticipants, onAddLog }: Props) {
  const router = useRouter();
  const supabase = createClient();

  // Selected Tournament
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'prize_desc' | 'name_asc'>('date_desc');

  // Pagination - Tournaments
  const [trnPage, setTrnPage] = useState(1);
  const TRN_PER_PAGE = 3;

  // Pagination - Participants
  const [ptcPage, setPtcPage] = useState(1);
  const PTC_PER_PAGE = 5;

  // Auto-select first tournament
  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(tournaments[0].id);
    }
  }, [tournaments, selectedTournamentId]);

  // Handle Export CSV (dummy function for now)
  const handleExportCSV = () => {
    toast.success("Mengekspor data ke CSV...");
  };

  const handleResetDataset = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSortBy('date_desc');
    setTrnPage(1);
    setPtcPage(1);
  };

  // 1. Filtered & Sorted Tournaments
  const filteredTournaments = useMemo(() => {
    let list = [...tournaments];

    // Search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(t => 
        t.name.toLowerCase().includes(q) || 
        (t.description || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter(t => t.status === statusFilter);
    }

    // Sort Order
    list.sort((a, b) => {
      if (sortBy === 'prize_desc') return b.prize_pool - a.prize_pool;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

    return list;
  }, [tournaments, searchQuery, statusFilter, sortBy]);

  // Paginated Tournaments
  const totalTrnPages = Math.max(1, Math.ceil(filteredTournaments.length / TRN_PER_PAGE));
  const paginatedTournaments = filteredTournaments.slice((trnPage - 1) * TRN_PER_PAGE, trnPage * TRN_PER_PAGE);

  // 2. Active Selected Tournament
  const activeSelectedTournament = tournaments.find(t => t.id === selectedTournamentId) || null;

  // 3. Participants for Selected Tournament
  const activeSelectedParticipants = useMemo(() => {
    if (!activeSelectedTournament) return [];
    return participants.filter(p => p.tournament_id === activeSelectedTournament.id);
  }, [participants, activeSelectedTournament]);

  // Paginated Participants
  const totalPtcPages = Math.max(1, Math.ceil(activeSelectedParticipants.length / PTC_PER_PAGE));
  const paginatedParticipants = activeSelectedParticipants.slice((ptcPage - 1) * PTC_PER_PAGE, ptcPage * PTC_PER_PAGE);

  // Reset participant page when tournament changes
  useEffect(() => {
    setPtcPage(1);
  }, [selectedTournamentId]);

  // Delete participant
  const confirmDeleteParticipant = (id: string, name: string) => {
    setParticipantToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const executeDeleteParticipant = async () => {
    if (!participantToDelete) return;
    setIsDeleting(true);
    try {
      await supabase.from("tournament_participants").delete().eq("id", participantToDelete.id);
      onAddLog(`Sistem menghapus data peserta ${participantToDelete.name}`, 'delete');
      toast.success("Berhasil menghapus peserta!");
      fetchParticipants();
    } catch (error) {
      toast.error("Gagal menghapus peserta");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setParticipantToDelete(null);
    }
  };

  // Confirm participant
  const handleConfirmParticipant = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin mengkonfirmasi peserta ${name}?`)) return;
    
    await supabase.from("tournament_participants").update({ status: 'confirmed' }).eq("id", id);
    onAddLog(`Sistem mengkonfirmasi peserta ${name}`, 'update');
    toast.success("Berhasil mengkonfirmasi peserta!");
    fetchParticipants();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      
      {/* LEFT SIDEBAR: TOURNAMENTS GRID SELECTION (Cols 5) */}
      <div className="xl:col-span-5 space-y-4">
        
        {/* SEARCH AND FILTERS CARD */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-gray-800">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-widest">Sirkuit Penyaringan</h4>
          </div>

          {/* Text Search input */}
          <div className="space-y-1">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Pencarian Nama Kompetisi</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Contoh: Bulutangkis, MLBB..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setTrnPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded pl-8 pr-3 py-1.5 text-xs outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-teal-600 transition-colors text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Status and Sort Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Status Turnamen</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTrnPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded p-1.5 text-[11px] outline-none font-medium cursor-pointer text-slate-700 dark:text-gray-300 transition-colors"
              >
                <option value="ALL">Semua Status</option>
                <option value="upcoming">Akan Datang</option>
                <option value="registration">Pendaftaran</option>
                <option value="ongoing">Aktif Berlangsung</option>
                <option value="completed">Sudah Selesai</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Penyusunan Urutan</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setTrnPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded p-1.5 text-[11px] outline-none font-medium cursor-pointer text-slate-700 dark:text-gray-300 transition-colors"
              >
                <option value="date_desc">Entri Terbaru</option>
                <option value="prize_desc">Hadiah Poin Terbanyak</option>
                <option value="name_asc">Alfabet Turnamen A-Z</option>
              </select>
            </div>
          </div>

          {/* Admin quick triggers */}
          {/* <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
            <button
              onClick={handleExportCSV}
              className="flex-1 py-1.5 px-2 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-300 rounded text-[9px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Ekspor CSV
            </button>
            <button
              onClick={handleResetDataset}
              className="flex-1 py-1.5 px-2 border border-dashed border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-[9px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Dataset
            </button>
          </div> */}
        </div>

        {/* LIST OF COMPILATIONS */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-3 bg-slate-50/70 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-800 dark:text-white uppercase tracking-widest">Daftar Turnamen ({filteredTournaments.length})</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-gray-800 min-h-[300px]">
            {paginatedTournaments.length === 0 ? (
              <div className="text-center py-10">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-50" />
                <p className="text-[10px] font-bold text-slate-500">Tidak menemukan kompetisi turnamen.</p>
              </div>
            ) : (
              paginatedTournaments.map(t => {
                const isSelected = t.id === selectedTournamentId;
                const countParticipate = participants.filter(p => p.tournament_id === t.id).length;
                const statusConf = TRN_STATUS_CONFIG[t.status];
                
                return (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTournamentId(t.id)}
                    className={`p-3.5 transition-all cursor-pointer relative flex flex-col text-left gap-2 ${
                      isSelected ? 'bg-slate-50/80 dark:bg-gray-800/80 border-l-4 border-teal-600' : 'hover:bg-slate-50/40 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 dark:text-gray-500 font-bold text-[9px] uppercase tracking-widest shrink-0 px-1.5 py-0.5 border border-slate-200 dark:border-gray-700 rounded bg-slate-50 dark:bg-gray-800">
                        {t.match_format} - {t.gender_category}
                      </span>
                      
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-center shrink-0 border ${statusConf.bg} ${statusConf.text} border-transparent`}>
                        {statusConf.label}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white leading-snug truncate" title={t.name}>{t.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 truncate mt-0.5">{t.description || 'Tidak ada deskripsi.'}</p>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-gray-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{countParticipate} Pengguna Terdaftar</span>
                      </div>
                      {/* <div className="font-mono text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/20 px-1.5 rounded">
                        {t.prize_pool.toLocaleString('id-ID')} Poin
                      </div> */}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* TOURNAMENTS PAGINATION */}
          {totalTrnPages > 1 && (
            <div className="p-3 border-t border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 flex items-center justify-between">
              <button 
                disabled={trnPage === 1}
                onClick={() => setTrnPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-[10px] font-bold rounded disabled:opacity-50 text-slate-700 dark:text-gray-300 transition-colors hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                Sebelumnya
              </button>
              <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">
                Halaman {trnPage} dari {totalTrnPages}
              </span>
              <button 
                disabled={trnPage === totalTrnPages}
                onClick={() => setTrnPage(p => Math.min(totalTrnPages, p + 1))}
                className="px-2 py-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-[10px] font-bold rounded disabled:opacity-50 text-slate-700 dark:text-gray-300 transition-colors hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT VIEW: DETAILED SELECTED TOURNAMENT + ENROLLED PLAYERS (Cols 7) */}
      <div className="xl:col-span-7 space-y-4">
        
        {activeSelectedTournament ? (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm p-4 md:p-5 space-y-5">
            
            {/* Header Information segment */}
            <div className="pb-5 border-b border-slate-100 dark:border-gray-800 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-sm text-[8px] font-extrabold tracking-widest text-slate-500 dark:text-gray-400 px-2 py-0.5 uppercase mb-1.5 leading-none">
                    <Clock className="w-2.5 h-2.5" /> ID: {activeSelectedTournament.id}
                  </div>
                  <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white leading-tight">
                    {activeSelectedTournament.name}
                  </h3>
                </div>
                {activeSelectedTournament.status !== 'completed' && (
                  <button
                    onClick={() => router.push(`/admin/participant/add?tournament_id=${activeSelectedTournament.id}`)}
                    className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 shadow-sm cursor-pointer select-none transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Daftarkan Peserta
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed font-medium">
                {activeSelectedTournament.description || "Tidak ada deskripsi tersedia untuk turnamen ini."}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-gray-800">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block">FORMAT & KATEGORI</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-gray-300 capitalize">{activeSelectedTournament.match_format} - {activeSelectedTournament.gender_category}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block">JADWAL PERTANDINGAN</span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-gray-300">
                    {new Date(activeSelectedTournament.start_date).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block">STATUS AKTIVITAS</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      activeSelectedTournament.status === 'ongoing' ? 'bg-emerald-500 animate-ping' :
                      activeSelectedTournament.status === 'upcoming' ? 'bg-sky-500' : 'bg-slate-400'
                    }`} />
                    {TRN_STATUS_CONFIG[activeSelectedTournament.status].label}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block">DISTRIBUSI HADIAH</span>
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-500 font-mono">
                    {activeSelectedTournament.prize_pool.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub Segment: REGISTERED USERS FOR THIS TOURNAMENT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-700 dark:text-gray-200 uppercase tracking-widest flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal-600 dark:text-teal-500" />
                  Peserta Turnamen Terdaftar ({activeSelectedParticipants.length})
                </h4>
                <span className="text-[9px] text-slate-400 dark:text-gray-500 font-mono">
                  Level & Ranking
                </span>
              </div>

              {activeSelectedParticipants.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50/50 dark:bg-gray-800/30">
                  <Users className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                  <h5 className="text-xs font-bold text-slate-600 dark:text-gray-400">Belum Ada Peserta Terdaftar</h5>
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                    Turnamen ini masih kosong. Klik tombol daftarkan peserta untuk menambah peserta baru.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 text-[9px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest select-none">
                          <th className="p-2.5 pl-3 whitespace-nowrap">Status & Pemain</th>
                          <th className="p-2.5 whitespace-nowrap">Level Ranking</th>
                          <th className="p-2.5 text-right whitespace-nowrap">Poin</th>
                          <th className="p-2.5 text-center w-20 whitespace-nowrap">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-medium text-slate-700 dark:text-gray-300">
                        {paginatedParticipants.map((p) => {
                          const statusColors = {
                            pending: 'bg-amber-100 text-amber-700 border border-amber-300',
                            confirmed: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
                            withdrawn: 'bg-slate-100 text-slate-600 border border-slate-300',
                            disqualified: 'bg-red-100 text-red-700 border border-red-300'
                          };
                          const sc = statusColors[p.status || 'pending'] || statusColors.pending;

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-gray-800/60 transition-colors">
                              
                              <td className="p-2.5 pl-3">
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <div className="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{p.profile?.fullname || 'Unknown'}</div>
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${sc}`} title={`Status: ${p.status}`}>
                                        {p.status || 'pending'}
                                      </span>
                                    </div>
                                    {/* <div className="text-[10px] text-slate-400 dark:text-gray-500 flex items-center gap-0.5 mt-0.5 truncate max-w-[150px]">
                                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{p.profile?.email || '-'}</span>
                                    </div> */}
                                  </div>
                                </div>
                              </td>

                              <td className="p-2.5">
                                <span className="font-semibold text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-gray-800 py-0.5 px-2 rounded-sm text-[10px]">
                                  {p.profile?.level || '-'}
                                </span>
                              </td>

                              <td className="p-2.5 text-right">
                                <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                                  {p.profile?.ranking_points?.toLocaleString() || 0}
                                </span>
                              </td>

                              <td className="p-2.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  {activeSelectedTournament?.status !== 'completed' ? (
                                    <>
                                      {p.status === 'pending' && (
                                        <button
                                          onClick={() => handleConfirmParticipant(p.id, p.profile?.fullname || 'Unknown')}
                                          className="p-1 border border-emerald-200 dark:border-emerald-800/30 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                                          title="Konfirmasi Peserta"
                                        >
                                          <CheckCircle2 className="w-3 h-3" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => router.push(`/admin/participant/edit/${p.id}`)}
                                        className="p-1 border border-slate-200 dark:border-gray-700 rounded hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                                        title="Edit Peserta"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => confirmDeleteParticipant(p.id, p.profile?.fullname || 'Unknown')}
                                        className="p-1 border border-slate-200 dark:border-gray-700 rounded hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 text-slate-400 dark:text-gray-500 transition-colors"
                                        title="Hapus Peserta"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">Selesai</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* PARTICIPANTS PAGINATION */}
                  {totalPtcPages > 1 && (
                    <div className="p-2.5 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 flex items-center justify-between">
                      <button 
                        disabled={ptcPage === 1}
                        onClick={() => setPtcPage(p => Math.max(1, p - 1))}
                        className="px-2 py-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-[10px] font-bold rounded disabled:opacity-50 text-slate-700 dark:text-gray-300 transition-colors hover:bg-slate-100 dark:hover:bg-gray-800"
                      >
                        Sebelumnya
                      </button>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">
                        Hal {ptcPage} / {totalPtcPages}
                      </span>
                      <button 
                        disabled={ptcPage === totalPtcPages}
                        onClick={() => setPtcPage(p => Math.min(totalPtcPages, p + 1))}
                        className="px-2 py-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-[10px] font-bold rounded disabled:opacity-50 text-slate-700 dark:text-gray-300 transition-colors hover:bg-slate-100 dark:hover:bg-gray-800"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center shadow-sm">
            <Trophy className="w-12 h-12 text-slate-300 dark:text-gray-700 mx-auto mb-2 opacity-50" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-gray-300">Tidak ada turnamen terpilih</h4>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Gunakan formulir disisi kiri untuk menyaring data atau mereset filter.</p>
          </div>
        )}
      </div>

      <DeleteParticipantModal
        isOpen={deleteModalOpen}
        participantName={participantToDelete?.name || null}
        isDeleting={isDeleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDeleteParticipant}
      />
    </div>
  );
}
