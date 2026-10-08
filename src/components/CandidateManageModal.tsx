import React, { useState } from 'react';
import { UserPlus, Edit3, Trash2, X, Check, AlertTriangle, Image, Upload } from 'lucide-react';
import { Candidate } from '../types/election';
import { electionStore, RT_LIST } from '../services/electionStore';
import { RwLogo } from './RwLogo';

import candidateBambangImg from '../assets/images/candidate_bambang_1791102566410.jpg';
import candidateSitiImg from '../assets/images/candidate_siti_1791102581968.jpg';
import candidateAgusImg from '../assets/images/candidate_agus_1791102598749.jpg';

interface CandidateManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
}

export const CandidateManageModal: React.FC<CandidateManageModalProps> = ({
  isOpen,
  onClose,
  candidates
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);

  // Form Fields
  const [number, setNumber] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [slogan, setSlogan] = useState<string>('');
  const [rtAsal, setRtAsal] = useState<string>('RT 01');
  const [age, setAge] = useState<number>(45);
  const [education, setEducation] = useState<string>('S1');
  const [occupation, setOccupation] = useState<string>('Wiraswasta');
  const [vision, setVision] = useState<string>('');
  const [missionsText, setMissionsText] = useState<string>('');
  const [programsText, setProgramsText] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>(candidateBambangImg);
  const [customPhotoInput, setCustomPhotoInput] = useState<string>('');

  const [notification, setNotification] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    const nextNum = candidates.length > 0 ? Math.max(...candidates.map(c => c.number)) + 1 : 1;
    setNumber(nextNum);
    setName('');
    setTitle('');
    setSlogan('');
    setRtAsal('RT 01');
    setAge(45);
    setEducation('S1');
    setOccupation('');
    setVision('');
    setMissionsText('');
    setProgramsText('');
    setPhotoUrl(candidateBambangImg);
    setCustomPhotoInput('');
    setIsEditing(false);
    setEditingCandidateId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleOpenEdit = (cand: Candidate) => {
    setEditingCandidateId(cand.id);
    setNumber(cand.number);
    setName(cand.name);
    setTitle(cand.title);
    setSlogan(cand.slogan);
    setRtAsal(cand.rtAsal);
    setAge(cand.age);
    setEducation(cand.education);
    setOccupation(cand.occupation);
    setVision(cand.vision);
    setMissionsText(cand.missions.join('\n'));
    setProgramsText(cand.programs.join('\n'));
    setPhotoUrl(cand.photo);
    setIsEditing(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama lengkap calon wajib diisi.');
      return;
    }

    const missions = missionsText
      .split('\n')
      .map(m => m.trim())
      .filter(Boolean);

    const programs = programsText
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean);

    const payload = {
      number,
      name: name.trim(),
      title: title.trim() || 'Tokoh Warga RW 14',
      photo: customPhotoInput.trim() || photoUrl,
      slogan: slogan.trim() || 'Bersama Membangun RW 14 Pedurungan Tengah',
      vision: vision.trim() || 'Mewujudkan RW 14 yang aman, nyaman, guyub rukun dan transparan.',
      missions: missions.length > 0 ? missions : ['Meningkatkan pelayanan kependudukan warga RW 14.'],
      programs: programs.length > 0 ? programs : ['Program gotong royong dan poskamling digital.'],
      rtAsal,
      age: Number(age) || 40,
      education: education.trim() || 'S1',
      occupation: occupation.trim() || 'Wirausaha'
    };

    try {
      if (editingCandidateId) {
        electionStore.updateCandidate(editingCandidateId, payload);
        setNotification(`Berhasil memperbarui data Calon No. 0${number} (${name})!`);
      } else {
        electionStore.addCandidate(payload);
        setNotification(`Berhasil menambahkan Calon Baru No. 0${number} (${name})!`);
      }
      setIsEditing(false);
      setEditingCandidateId(null);
      setTimeout(() => setNotification(''), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan kandidat.');
    }
  };

  const handleDelete = (id: string) => {
    const cand = candidates.find(c => c.id === id);
    if (!cand) return;

    electionStore.deleteCandidate(id);
    setDeleteConfirmId(null);
    setNotification(`Calon No. 0${cand.number} (${cand.name}) berhasil dihapus.`);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RwLogo className="w-9 h-9" />
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Kelola Kandidat Calon Ketua RW 14
              </h2>
              <span className="text-[11px] text-slate-300">
                Tambah, Koreksi / Edit, dan Hapus Calon Ketua RW 14 Kel. Pedurungan Tengah
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Notification banner */}
          {notification && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Calon Ketua RW 14 ({candidates.length} Calon Terdaftar)
              </h3>
              <span className="text-xs text-slate-500">
                Nomor urut, data profil, foto, visi, misi dan program kerja dapat disesuaikan.
              </span>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3.5 py-2 bg-red-700 hover:bg-red-800 active:scale-[0.98] text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Calon Baru</span>
              </button>
            )}
          </div>

          {/* FORM: TAMBAH / KOREKSI */}
          {isEditing && (
            <form onSubmit={handleSave} className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-300 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-sm text-slate-900">
                  {editingCandidateId ? 'Koreksi / Edit Data Calon' : 'Formulir Pendaftaran Calon Baru'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
              </div>

              {/* Row 1: Nomor, Nama, Gelar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Nomor Urut:</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={number}
                    onChange={e => setNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: Ir. H. Bambang Santoso, M.T."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Asal RT:</label>
                  <select
                    value={rtAsal}
                    onChange={e => setRtAsal(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {RT_LIST.map(rt => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Title & Slogan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Profesi / Pengalaman:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Contoh: Tokoh Penggerak Lingkungan & Wirausaha"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slogan Calon:</label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={e => setSlogan(e.target.value)}
                    placeholder="Contoh: RW 14 Asri, Digital & Transparan"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Row 3: Usia, Pendidikan, Pekerjaan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Usia (Tahun):</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(parseInt(e.target.value, 10) || 40)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pendidikan:</label>
                  <input
                    type="text"
                    value={education}
                    onChange={e => setEducation(e.target.value)}
                    placeholder="Contoh: S1 Teknik Sipil"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pekerjaan:</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    placeholder="Contoh: Konsultan / ASN"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Photo Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Foto Calon:</label>
                <div className="flex items-center gap-3">
                  <img
                    src={photoUrl}
                    alt="Pratinjau Foto"
                    className="w-14 h-14 rounded-lg object-cover border border-slate-300 bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Foto Perangkat</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-slate-400">atau pilih avatar:</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(candidateBambangImg)}
                        className={`px-2 py-0.5 rounded border text-[11px] cursor-pointer ${
                          photoUrl === candidateBambangImg ? 'bg-red-50 border-red-400 text-red-700 font-bold' : 'bg-white'
                        }`}
                      >
                        Foto 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(candidateSitiImg)}
                        className={`px-2 py-0.5 rounded border text-[11px] cursor-pointer ${
                          photoUrl === candidateSitiImg ? 'bg-red-50 border-red-400 text-red-700 font-bold' : 'bg-white'
                        }`}
                      >
                        Foto 2
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(candidateAgusImg)}
                        className={`px-2 py-0.5 rounded border text-[11px] cursor-pointer ${
                          photoUrl === candidateAgusImg ? 'bg-red-50 border-red-400 text-red-700 font-bold' : 'bg-white'
                        }`}
                      >
                        Foto 3
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vision */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Visi Utama:</label>
                <textarea
                  rows={2}
                  value={vision}
                  onChange={e => setVision(e.target.value)}
                  placeholder="Visi calon untuk RW 14..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  required
                />
              </div>

              {/* Missions (1 per line) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Misi Calon (Tulis 1 misi per baris):
                </label>
                <textarea
                  rows={3}
                  value={missionsText}
                  onChange={e => setMissionsText(e.target.value)}
                  placeholder="Misi 1&#10;Misi 2&#10;Misi 3"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              {/* Programs (1 per line) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Program Kerja Unggulan (Tulis 1 program per baris):
                </label>
                <textarea
                  rows={3}
                  value={programsText}
                  onChange={e => setProgramsText(e.target.value)}
                  placeholder="Program 1&#10;Program 2&#10;Program 3"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingCandidateId ? 'Simpan Koreksi' : 'Tambahkan Calon'}
                </button>
              </div>
            </form>
          )}

          {/* CANDIDATES LIST: DUAL VIEW (Mobile Cards < sm, Desktop Table >= sm) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Mobile Card List (< sm) */}
            <div className="sm:hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {candidates.map(c => (
                <div key={c.id} className="p-3.5 bg-white hover:bg-slate-50 transition-colors space-y-2.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={c.photo}
                      alt={c.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-300 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-5 h-5 rounded bg-red-700 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          0{c.number}
                        </span>
                        <div className="font-bold text-slate-900 text-xs truncate">{c.name}</div>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{c.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="text-slate-600 font-medium">Asal {c.rtAsal}</span>
                        <span>·</span>
                        <span className="font-bold text-slate-900 tabular-nums">{c.voteCount} Suara</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Koreksi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(c.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}

              {candidates.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada kandidat calon terdaftar. Silakan klik tombol &ldquo;Tambah Calon Baru&rdquo;.
                </div>
              )}
            </div>

            {/* Desktop Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No. Urut</th>
                    <th className="py-2.5 px-3">Foto</th>
                    <th className="py-2.5 px-3">Nama Lengkap & Profesi</th>
                    <th className="py-2.5 px-3">Asal RT</th>
                    <th className="py-2.5 px-3">Perolehan Suara</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-red-700 text-sm">
                        0{c.number}
                      </td>
                      <td className="py-2.5 px-3">
                        <img
                          src={c.photo}
                          alt={c.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-300"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.title}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {c.rtAsal}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 tabular-nums">
                        {c.voteCount} Suara
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit / Koreksi */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            title="Koreksi data calon"
                            className="p-1.5 text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / Hapus */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(c.id)}
                            title="Hapus calon"
                            className="p-1.5 text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada kandidat calon terdaftar. Silakan klik tombol &ldquo;Tambah Calon Baru&rdquo;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delete Confirmation Alert Modal */}
          {deleteConfirmId && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    Konfirmasi Hapus Kandidat
                  </span>
                  <span>
                    Apakah Anda yakin ingin menghapus calon ini dari bursa pemilihan Ketua RW 14? Tindakan ini tidak dapat dibatalkan.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Ya, Hapus Calon
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
