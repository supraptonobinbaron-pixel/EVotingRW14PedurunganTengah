import React, { useState } from 'react';
import { Search, CheckCircle2, UserX, ShieldCheck, X, UserPlus, Filter, Trash2, RotateCcw } from 'lucide-react';
import { CitizenRecord } from '../types/election';
import { electionStore, RT_LIST } from '../services/electionStore';
import { RwLogo } from './RwLogo';

interface DptLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifyCitizen: (citizen: CitizenRecord) => void;
}

export const DptLookupModal: React.FC<DptLookupModalProps> = ({
  isOpen,
  onClose,
  onVerifyCitizen
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRt, setSelectedRt] = useState<string>('ALL');
  const [showRegisterForm, setShowRegisterForm] = useState<boolean>(false);

  // New resident form states
  const [regNik, setRegNik] = useState<string>('');
  const [regNama, setRegNama] = useState<string>('');
  const [regRt, setRegRt] = useState<string>('RT 01');
  const [regAlamat, setRegAlamat] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regGender, setRegGender] = useState<'L' | 'P'>('L');
  const [regStatusMsg, setRegStatusMsg] = useState<string>('');

  if (!isOpen) return null;

  const dptList = electionStore.getDptList();

  // Filtered DPT
  const filteredList = dptList.filter(c => {
    const matchesRt = selectedRt === 'ALL' || c.rt === selectedRt;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesRt;
    const matchesSearch = c.nama.toLowerCase().includes(q) || c.nik.includes(q) || c.nikMasked.includes(q);
    return matchesRt && matchesSearch;
  });

  const handleRegisterResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regNik.length !== 16 || !regNik.startsWith('3374')) {
      setRegStatusMsg('NIK wajib 16 digit dan diawali kode Kota Semarang (3374...).');
      return;
    }
    if (!regNama.trim()) {
      setRegStatusMsg('Nama lengkap warga wajib diisi.');
      return;
    }

    try {
      const newCitizen = await electionStore.registerResidentToDpt(
        regNik,
        regNama,
        regRt,
        regAlamat || `Jl. Pedurungan Tengah ${regRt}`,
        regPhone || '081234567890',
        '1995-05-15',
        regGender
      );
      setRegStatusMsg(`Berhasil mendaftarkan ${newCitizen.nama} ke DPT ${newCitizen.rt}!`);
      setShowRegisterForm(false);
      setSearchQuery(newCitizen.nama);
    } catch {
      setRegStatusMsg('Gagal menambahkan warga ke DPT.');
    }
  };

  const handleClearAllDpt = () => {
    if (confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA DATA DPT RW 14? Seluruh daftar warga terdaftar akan dikosongkan.')) {
      electionStore.clearAllDpt();
      setRegStatusMsg('Seluruh data DPT RW 14 telah berhasil dihapus bersih.');
      setTimeout(() => setRegStatusMsg(''), 3000);
    }
  };

  const handleDeleteOneCitizen = (citizen: CitizenRecord) => {
    if (confirm(`Hapus data pemilih: ${citizen.nama} (${citizen.nikMasked})?`)) {
      electionStore.deleteCitizen(citizen.id);
    }
  };

  const handleLoadSample = () => {
    electionStore.loadSampleDpt();
    setRegStatusMsg('Data DPT sampel RW 14 berhasil dimuat.');
    setTimeout(() => setRegStatusMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6">
        
        {/* Header with New Logo */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RwLogo className="w-9 h-9" />
            <div>
              <h2 className="text-base font-bold leading-tight">Daftar Pemilih Tetap (DPT) RW 14</h2>
              <span className="text-[11px] text-slate-300">
                Kel. Pedurungan Tengah · Kec. Pedurungan, Kota Semarang (RT 01 s/d RT 06)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          
          {regStatusMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              {regStatusMsg}
            </div>
          )}

          {/* Controls Bar: Search, RT Filter & Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan Nama atau NIK..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-slate-50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={selectedRt}
                onChange={e => setSelectedRt(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
              >
                <option value="ALL">Semua RT (RT 01 - RT 06)</option>
                {RT_LIST.map(rt => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowRegisterForm(!showRegisterForm)}
                className="px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showRegisterForm ? 'Tutup Form' : 'Tambah Warga'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllDpt}
                title="Hapus semua data DPT RW 14"
                className="px-3 py-2 text-xs font-semibold text-red-700 hover:text-white hover:bg-red-700 border border-red-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua DPT</span>
              </button>
            </div>
          </div>

          {/* New Resident Registration Form (Self-Service) */}
          {showRegisterForm && (
            <form onSubmit={handleRegisterResident} className="p-4 bg-slate-50 rounded-xl border border-slate-300 text-xs space-y-3">
              <span className="font-bold text-slate-800 block text-sm">
                Pendaftaran Warga Baru RW 14 Pedurungan Tengah
              </span>
              <p className="text-slate-500">
                Warga yang memiliki e-KTP Kota Semarang di wilayah RT 01 s/d RT 06 dapat didaftarkan sebagai pemilih tetap.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK (16 Digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={regNik}
                    onChange={e => setRegNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="337411XXXXXXXXXX"
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={regNama}
                    onChange={e => setRegNama(e.target.value)}
                    placeholder="Sesuai KTP"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rukun Tetangga</label>
                  <select
                    value={regRt}
                    onChange={e => setRegRt(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {RT_LIST.map(rt => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={regGender}
                    onChange={e => setRegGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="08XXXXXXXXXX"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Simpan & Daftarkan ke DPT
              </button>
            </form>
          )}

          {/* DPT LIST: DUAL VIEW (Mobile Cards < sm, Desktop Table >= sm) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Mobile Card List (< sm) */}
            <div className="sm:hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {filteredList.map(citizen => (
                <div key={citizen.id} className="p-3 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-2.5">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 text-xs truncate">
                      {citizen.nama}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                      <span>{citizen.nikMasked}</span>
                      <span>·</span>
                      <span className="font-sans font-medium text-slate-700">{citizen.rt}</span>
                    </div>
                    <div>
                      {citizen.hasVoted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Sudah Memilih</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <UserX className="w-2.5 h-2.5 text-amber-600" />
                          <span>Belum Memilih</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!citizen.hasVoted ? (
                      <button
                        type="button"
                        onClick={() => {
                          onVerifyCitizen(citizen);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs cursor-pointer min-h-[36px]"
                      >
                        Pilih
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic px-1">
                        Sah
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteOneCitizen(citizen)}
                      title="Hapus pemilih"
                      className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredList.length === 0 && (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <p className="font-semibold text-slate-700 text-xs">
                    Tidak Ada Data Pemilih Terdaftar (DPT Kosong)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Data DPT telah dihapus bersih atau pencarian tidak cocok.
                  </p>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRegisterForm(true)}
                      className="px-3 py-1.5 bg-red-700 text-white rounded-lg font-semibold text-xs cursor-pointer"
                    >
                      + Tambah Warga
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs cursor-pointer"
                    >
                      Muat Sampel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Nama Pemilih</th>
                    <th className="py-2.5 px-3">NIK (Tersamarkan)</th>
                    <th className="py-2.5 px-3">Wilayah</th>
                    <th className="py-2.5 px-3">Status Hak Suara</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map(citizen => (
                    <tr key={citizen.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {citizen.nama}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {citizen.nikMasked}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {citizen.rt} / RW 14
                      </td>
                      <td className="py-2.5 px-3">
                        {citizen.hasVoted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Sudah Memilih</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <UserX className="w-3 h-3 text-amber-600" />
                            <span>Belum Memilih</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!citizen.hasVoted ? (
                            <button
                              type="button"
                              onClick={() => {
                                onVerifyCitizen(citizen);
                                onClose();
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-red-700 hover:bg-red-800 rounded transition-colors cursor-pointer"
                            >
                              Pilih Sekarang
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Tercatat Sah
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteOneCitizen(citizen)}
                            title="Hapus pemilih"
                            className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        <div className="max-w-sm mx-auto space-y-2">
                          <p className="font-semibold text-slate-700 text-sm">
                            Tidak Ada Data Pemilih Terdaftar (DPT Kosong)
                          </p>
                          <p className="text-xs text-slate-500">
                            Data DPT telah dihapus bersih. Anda dapat menambahkan warga pemilih secara manual atau memuat data sampel jika diperlukan.
                          </p>
                          <div className="flex justify-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowRegisterForm(true)}
                              className="px-3 py-1.5 bg-red-700 text-white rounded-lg font-semibold text-xs cursor-pointer"
                            >
                              + Daftarkan Warga DPT
                            </button>
                            <button
                              type="button"
                              onClick={handleLoadSample}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Muat Sampel DPT</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Kerahasiaan NIK dilindungi enkripsi AES-256</span>
            </span>
            <span className="font-semibold text-slate-700">
              Total Ditampilkan: {filteredList.length} Pemilih
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
