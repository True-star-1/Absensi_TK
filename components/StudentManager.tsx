import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Search, User, LayoutGrid, List, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { Student, ClassRoom } from '../types';
import { supabase } from '../lib/supabase';

interface StudentManagerProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  classes: ClassRoom[];
}

const StudentManager: React.FC<StudentManagerProps> = ({ students, setStudents, classes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeClassId, setActiveClassId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.nis.includes(searchTerm);
    const matchesClass = activeClassId === 'all' || s.classId === activeClassId;
    return matchesSearch && matchesClass;
  });

  const openModal = (student: Student | null = null) => {
    if (student) {
      setEditingStudent(student);
      setNis(student.nis);
      setName(student.name);
      setClassId(student.classId);
    } else {
      setEditingStudent(null);
      setNis('');
      setName('');
      // OTOMATIS: Jika sedang membuka tab kelas tertentu, form langsung mengarah ke kelas tersebut
      setClassId(activeClassId !== 'all' ? activeClassId : (classes[0]?.id || ''));
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis || !name || !classId) {
      Swal.fire('Data Belum Lengkap', 'Mohon isi NIS, Nama, dan pilih Kelas.', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update({ nis, name, classId })
          .eq('id', editingStudent.id);

        if (error) throw error;

        setStudents(students.map(s => s.id === editingStudent.id ? { ...s, nis, name, classId } : s));
      } else {
        const newStudent: Omit<Student, 'id'> = { nis, name, classId };
        const { data, error } = await supabase.from('students').insert([newStudent]).select();

        if (error) throw error;
        if (data) setStudents([...students, data[0]]);
      }
      
      setIsModalOpen(false);
      Swal.fire({ icon: 'success', title: 'Data Berhasil Disimpan', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Error saving student:', error);
      Swal.fire('Error', 'Gagal menyimpan data ke database.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Siswa?',
      text: "Data kehadiran siswa ini juga akan hilang secara permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) throw error;
        setStudents(students.filter(s => s.id !== id));
        Swal.fire('Terhapus!', 'Data siswa telah dihapus.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus data.', 'error');
      }
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Data Anak Didik</h1>
          <p className="text-slate-500 font-medium italic">Kelola siswa berdasarkan kelompok kelas agar lebih rapi.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all w-full md:w-auto justify-center active:scale-95"
        >
          <Plus size={20} /> Tambah Siswa Baru
        </button>
      </div>

      {/* TABS KELOMPOK KELAS - Mobile Friendly Scroll */}
      <div className="mb-6 overflow-x-auto no-scrollbar flex items-center gap-2 pb-2">
        <button
          onClick={() => setActiveClassId('all')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
            activeClassId === 'all' 
            ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
            : 'bg-white text-slate-400 border-slate-100'
          }`}
        >
          <List size={14} /> Semua Siswa
        </button>
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setActiveClassId(cls.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
              activeClassId === cls.id 
              ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-100' 
              : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
            }`}
          >
            <LayoutGrid size={14} /> {cls.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-12">
        <div className="p-5 border-b border-slate-50 bg-slate-50/20">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
            <Search size={18} className="text-slate-300" />
            <input 
              className="bg-transparent w-full focus:outline-none text-slate-600 font-bold placeholder:text-slate-300"
              placeholder="Cari nama siswa atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">NIS/NISN</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelompok</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center font-black border border-blue-100/50">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-black text-slate-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-sm font-bold text-slate-500">{s.nis}</td>
                  <td className="px-6 py-5">
                    <span className="inline-block whitespace-nowrap px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                      {classes.find(c => c.id === s.classId)?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openModal(s)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="max-w-xs mx-auto text-slate-300">
                      <User size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-bold italic">Belum ada data siswa di kelompok ini.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black mb-6 text-slate-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="text-blue-500" />
              {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nomor Induk (NIS/NISN)</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 transition-all" 
                  value={nis} 
                  onChange={(e) => setNis(e.target.value)} 
                  placeholder="Contoh: 2024001"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Lengkap Siswa</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 transition-all" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Nama Lengkap Anak"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Kelompok Belajar / Kelas</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 transition-all" 
                  value={classId} 
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-6">
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="flex-1 bg-blue-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-600 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isProcessing ? 'Menyimpan...' : 'Simpan Data'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black active:scale-95 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;