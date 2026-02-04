import React, { useState, useEffect } from 'react';
import { Save, School } from 'lucide-react';
import Swal from 'sweetalert2';
import { Student, ClassRoom, AttendanceRecord, AttendanceStatus } from '../types';
import { supabase } from '../lib/supabase';

interface AttendanceFormProps {
  classes: ClassRoom[];
  students: Student[];
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ classes, students, attendance, setAttendance }) => {
  const getLocalDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [isProcessing, setIsProcessing] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  
  const [currentSession, setCurrentSession] = useState<Record<string, { status: AttendanceStatus, note?: string }>>({});

  const filteredStudents = students.filter(s => s.classId === selectedClassId);

  const isNoteRequired = (status: string | undefined): boolean => {
    if (!status) return false;
    const s = String(status).toLowerCase().trim();
    return s === 'sakit' || s === 'izin';
  };

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      const existing = attendance.filter(a => a.date === selectedDate);
      const session: Record<string, { status: AttendanceStatus, note?: string }> = {};
      
      filteredStudents.forEach(s => {
        const record = existing.find(r => r.studentId === s.id);
        if (record) {
          const dbStatus = String(record.status).toLowerCase().trim();
          let normStatus = record.status;
          
          if (dbStatus === 'hadir') normStatus = AttendanceStatus.HADIR;
          else if (dbStatus === 'sakit') normStatus = AttendanceStatus.SAKIT;
          else if (dbStatus === 'izin') normStatus = AttendanceStatus.IZIN;
          else if (dbStatus === 'alpha') normStatus = AttendanceStatus.ALPHA;

          session[s.id] = { status: normStatus, note: record.note || '' };
        }
      });
      setCurrentSession(session);
      setAttemptedSave(false);
    }
  }, [selectedClassId, selectedDate, attendance]);

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setCurrentSession(prev => ({
      ...prev,
      [studentId]: { 
        ...prev[studentId], 
        status, 
        note: prev[studentId]?.note || '' 
      }
    }));
  };

  const updateNote = (studentId: string, note: string) => {
    setCurrentSession(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note }
    }));
  };

  const handleSave = async () => {
    if (!selectedClassId) return;
    setAttemptedSave(true);

    const unselected = filteredStudents.filter(s => !currentSession[s.id]?.status);
    if (unselected.length > 0) {
      Swal.fire('Belum Selesai', `Ada ${unselected.length} anak yang belum diabsen.`, 'warning');
      return;
    }

    // Validasi ketat: Keterangan Wajib jika Izin atau Sakit
    const invalidStudents = filteredStudents.filter(s => {
      const sess = currentSession[s.id];
      const statusStr = String(sess.status).toLowerCase().trim();
      const needsNote = statusStr === 'sakit' || statusStr === 'izin';
      return needsNote && (!sess.note || sess.note.trim() === '');
    });

    if (invalidStudents.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Keterangan Wajib Diisi',
        text: 'Alasan Sakit atau Izin tidak boleh kosong untuk keperluan laporan.',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const records = filteredStudents.map(s => ({
        id: `${selectedDate}-${s.id}`,
        studentId: s.id,
        date: selectedDate,
        status: currentSession[s.id].status,
        note: currentSession[s.id].note || ''
      }));

      const { error } = await supabase.from('attendance').upsert(records);
      if (error) throw error;

      setAttendance(prev => {
        const others = prev.filter(r => !(r.date === selectedDate && filteredStudents.some(fs => fs.id === r.studentId)));
        return [...others, ...records];
      });

      setAttemptedSave(false);
      Swal.fire({ 
        icon: 'success', 
        title: 'Absensi Tersimpan', 
        text: 'Data telah diperbarui di database.',
        timer: 1500, 
        showConfirmButton: false 
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Gagal Simpan', 'Koneksi database bermasalah.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Input Absensi</h1>
        <p className="text-slate-500 font-medium">Rekam kehadiran anak didik dengan teliti.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pilih Kelas</label>
            <select 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={isProcessing}
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tanggal</label>
            <input 
              type="date"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[32px] text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-100">
          <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">Total Murid</p>
          <h2 className="text-5xl font-black">{filteredStudents.length}</h2>
        </div>
      </div>

      {selectedClassId ? (
        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const sess = currentSession[student.id];
            const needsNote = isNoteRequired(sess?.status);
            const isError = attemptedSave && needsNote && (!sess?.note || sess.note.trim() === '');

            return (
              <div key={student.id} className={`bg-white p-5 md:p-6 rounded-[28px] border transition-all duration-300 ${isError ? 'border-red-300 bg-red-50/20 shadow-lg shadow-red-50' : 'border-slate-100 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border ${isError ? 'bg-red-100 text-red-600 border-red-200' : 'bg-slate-50 text-indigo-600 border-slate-100'}`}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className={`font-black text-base ${isError ? 'text-red-700' : 'text-slate-800'}`}>{student.name}</h3>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">NIS: {student.nis}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <StatusBtn label="Hadir" active={sess?.status === AttendanceStatus.HADIR} onClick={() => updateStatus(student.id, AttendanceStatus.HADIR)} color="emerald" />
                    <StatusBtn label="Sakit" active={sess?.status === AttendanceStatus.SAKIT} onClick={() => updateStatus(student.id, AttendanceStatus.SAKIT)} color="blue" />
                    <StatusBtn label="Izin" active={sess?.status === AttendanceStatus.IZIN} onClick={() => updateStatus(student.id, AttendanceStatus.IZIN)} color="amber" />
                    <StatusBtn label="Alpha" active={sess?.status === AttendanceStatus.ALPHA} onClick={() => updateStatus(student.id, AttendanceStatus.ALPHA)} color="red" />
                  </div>
                </div>

                {needsNote && (
                  <div className="mt-4 animate-in slide-in-from-top-2">
                    <label className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${isError ? 'text-red-600' : 'text-slate-400'}`}>
                      Alasan {sess.status} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      placeholder={`Ketik alasan di sini...`}
                      className={`w-full p-3.5 rounded-xl border outline-none font-medium text-xs italic transition-all ${isError ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-100 placeholder-red-300' : 'bg-slate-50 border-slate-100 focus:ring-2 focus:ring-indigo-100'}`}
                      value={sess?.note || ''}
                      onChange={(e) => updateNote(student.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="fixed bottom-24 left-0 right-0 px-6 md:static md:px-0 md:pt-10 flex justify-center z-40">
            <button 
              onClick={handleSave}
              disabled={isProcessing}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Save size={18} />
              {isProcessing ? 'Menyimpan...' : 'Simpan Absensi'}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-24 text-center bg-white rounded-[48px] border-2 border-slate-100 border-dashed">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <School size={40} />
          </div>
          <p className="text-slate-400 font-bold max-w-xs mx-auto">Pilih kelas terlebih dahulu.</p>
        </div>
      )}
    </div>
  );
};

const StatusBtn: React.FC<{ label: string, active: boolean, onClick: () => void, color: string }> = ({ label, active, onClick, color }) => {
  const styles: Record<string, string> = {
    emerald: active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600',
    blue: active ? 'bg-blue-500 text-white shadow-md shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600',
    amber: active ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600',
    red: active ? 'bg-red-500 text-white shadow-md shadow-red-100' : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600',
  };
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-xl font-black text-[9px] uppercase transition-all transform active:scale-90 ${styles[color]}`}>
      {label}
    </button>
  );
};

export default AttendanceForm;