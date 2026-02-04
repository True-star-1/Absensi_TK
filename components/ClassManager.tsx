
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, School } from 'lucide-react';
import Swal from 'sweetalert2';
import { ClassRoom } from '../types';
import { supabase } from '../lib/supabase';

interface ClassManagerProps {
  classes: ClassRoom[];
  setClasses: React.Dispatch<React.SetStateAction<ClassRoom[]>>;
}

const ClassManager: React.FC<ClassManagerProps> = ({ classes, setClasses }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAdd = async () => {
    if (!newClassName.trim()) return;
    setIsProcessing(true);
    try {
      const newClass: Omit<ClassRoom, 'id'> = {
        name: newClassName
      };
      
      const { data, error } = await supabase
        .from('classes')
        .insert([newClass])
        .select();

      if (error) throw error;

      if (data) {
        setClasses([...classes, data[0]]);
        setNewClassName('');
        setIsAdding(false);
        Swal.fire({
          icon: 'success',
          title: 'Kelas Berhasil Ditambahkan',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error adding class:', error);
      Swal.fire('Error', 'Gagal menambah kelas.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Kelas?',
      text: "Data siswa di kelas ini tidak akan terhapus namun relasinya akan hilang.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setClasses(classes.filter(c => c.id !== id));
        Swal.fire('Terhapus!', 'Kelas telah dihapus.', 'success');
      } catch (error) {
        console.error('Error deleting class:', error);
        Swal.fire('Error', 'Gagal menghapus kelas.', 'error');
      }
    }
  };

  const handleEdit = (c: ClassRoom) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({ name: editName })
        .eq('id', editingId);

      if (error) throw error;

      setClasses(classes.map(c => c.id === editingId ? { ...c, name: editName } : c));
      setEditingId(null);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil diperbarui',
        timer: 1000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating class:', error);
      Swal.fire('Error', 'Gagal memperbarui kelas.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Kelas</h1>
          <p className="text-slate-500 font-medium">Kelola rombongan belajar di TK Anda.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all"
        >
          <Plus size={20} />
          Tambah Kelas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdding && (
          <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-blue-200 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-blue-600 flex items-center gap-2">
              <Plus size={18} /> Baru
            </h3>
            <input 
              autoFocus
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Contoh: TK B - Pelangi"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              disabled={isProcessing}
            />
            <div className="flex gap-2">
              <button 
                onClick={handleAdd} 
                className="flex-1 bg-blue-500 text-white py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                disabled={isProcessing}
              >
                {isProcessing ? '...' : 'Simpan'}
              </button>
              <button 
                onClick={() => setIsAdding(false)} 
                className="flex-1 bg-slate-100 text-slate-500 py-2 rounded-xl font-bold text-sm"
                disabled={isProcessing}
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {classes.map((c) => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group transition-all hover:shadow-md">
            <div className="flex items-center gap-4 flex-1 mr-2">
              <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-500 shrink-0">
                <School size={24} />
              </div>
              <div className="min-w-0 flex-1">
                {editingId === c.id ? (
                  <input 
                    className="w-full p-1 border-b-2 border-blue-400 focus:outline-none bg-transparent"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    disabled={isProcessing}
                  />
                ) : (
                  <h3 className="font-bold text-lg text-slate-800 truncate">{c.name}</h3>
                )}
                <p className="text-xs text-slate-400 font-medium tracking-wide truncate">ID: {c.id.toString().substring(0, 8)}</p>
              </div>
            </div>
            
            <div className="flex gap-1 shrink-0">
              {editingId === c.id ? (
                <button onClick={handleSaveEdit} disabled={isProcessing} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Save size={18} /></button>
              ) : (
                <button onClick={() => handleEdit(c)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
              )}
              <button onClick={() => handleDelete(c.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}

        {classes.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <School size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Belum ada kelas</h3>
            <p className="text-slate-500">Silakan tambahkan kelas pertama Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassManager;
