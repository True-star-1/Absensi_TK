
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Search, User, MoreVertical } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nis.includes(searchTerm)
  );

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
      setClassId(classes[0]?.id || '');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis || !name || !classId) {
      Swal.fire('Oops!', 'Mohon lengkapi semua data.', 'error');
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
        const newStudent: Omit<Student, 'id'> = {
          nis,
          name,
          classId
        };
        
        const { data, error } = await supabase
          .from('students')
          .insert([newStudent])
          .select();

        if (error) throw error;

        if (data) {
          setStudents([...students, data[0]]);
        }
      }
      
      setIsModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Data Siswa Disimpan',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error saving student:', error);
      Swal.fire('Error', 'Gagal menyimpan data siswa.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Siswa?',
      text: "Data absensi siswa ini juga akan terhapus.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setStudents(students.filter(s => s.id !== id));
        Swal.fire('Terhapus!', 'Siswa telah dihapus.', 'success');
      } catch (error) {
        console.error('Error deleting student:', error);
        Swal.fire('Error', 'Gagal menghapus siswa.', 'error');
      }
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Siswa</h1>
          <p className="text-slate-500 font-medium">Daftar anak didik di TK.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          Tambah Siswa
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-12">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex-1 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              className="bg-transparent w-full focus:outline-none text-slate-600 font-medium"
              placeholder="Cari nama atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Siswa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">NIS/NISN</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-sm">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-700">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-500">{s.nis}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                      {classes.find(c => c.id === s.classId)?.name || 'Tanpa Kelas'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                    {/* Always visible dots for mobile if group-hover doesn't trigger well */}
                    <button className="md:hidden p-2 text-slate-400"><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    Data tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">
              {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">NIS / NISN</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Misal: 12345678"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Siswa"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Pilih Kelas</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {isProcessing ? 'Menyimpan...' : 'Simpan Data'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isProcessing}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold"
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
