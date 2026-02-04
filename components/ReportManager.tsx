import React, { useState, useMemo } from 'react';
import { 
  Printer,
  FileSpreadsheet,
  FileText,
  Download
} from 'lucide-react';
import { Student, ClassRoom, AttendanceRecord } from '../types';
import Swal from 'sweetalert2';

interface ReportManagerProps {
  classes: ClassRoom[];
  students: Student[];
  attendance: AttendanceRecord[];
}

const ReportManager: React.FC<ReportManagerProps> = ({ classes, students, attendance }) => {
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('monthly');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);
  const daysInMonth = useMemo(() => new Date(selectedYear, selectedMonth, 0).getDate(), [selectedMonth, selectedYear]);
  const filteredStudents = useMemo(() => students.filter(s => s.classId === selectedClassId), [students, selectedClassId]);

  const reportData = useMemo(() => {
    const matchStatus = (val: any, target: string) => {
      if (!val) return false;
      return String(val).toLowerCase().trim() === target.toLowerCase().trim();
    };

    if (reportType === 'daily') {
      return filteredStudents.map(s => {
        const rec = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
        return { ...s, status: rec?.status || '-', note: rec?.note || '' };
      });
    } else {
      return filteredStudents.map(s => {
        const studentRecs = attendance.filter(a => {
          const d = new Date(a.date);
          return a.studentId === s.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
        });

        const dailyStats: Record<number, string> = {};
        for(let i=1; i<=daysInMonth; i++) {
          const dStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const rec = studentRecs.find(a => a.date === dStr);
          dailyStats[i] = rec?.status ? String(rec.status).charAt(0).toUpperCase() : '';
        }

        return {
          ...s,
          dailyStats,
          h: studentRecs.filter(a => matchStatus(a.status, 'Hadir')).length,
          s: studentRecs.filter(a => matchStatus(a.status, 'Sakit')).length,
          i: studentRecs.filter(a => matchStatus(a.status, 'Izin')).length,
          a: studentRecs.filter(a => matchStatus(a.status, 'Alpha')).length,
        };
      });
    }
  }, [reportType, filteredStudents, attendance, selectedDate, selectedMonth, selectedYear, daysInMonth]);

  const handlePrint = () => {
    if (!selectedClassId) {
      Swal.fire('Perhatian', 'Silakan pilih kelas terlebih dahulu.', 'warning');
      return;
    }
    window.print();
  };

  const exportToExcel = () => {
    if (!selectedClassId) {
      Swal.fire('Perhatian', 'Silakan pilih kelas terlebih dahulu.', 'warning');
      return;
    }

    try {
      const SEP = ";";
      let csvContent = "";
      const fileName = `Laporan_Absensi_${selectedClass?.name || 'Kelas'}_${reportType === 'daily' ? selectedDate : months[selectedMonth-1] + '_' + selectedYear}.csv`;

      if (reportType === 'daily') {
        csvContent = `No${SEP}NIS${SEP}Nama Siswa${SEP}Status${SEP}Keterangan\n`;
        reportData.forEach((row: any, idx) => {
          csvContent += `${idx + 1}${SEP}${row.nis}${SEP}"${row.name}"${SEP}${row.status}${SEP}"${row.note || '-'}"\n`;
        });
      } else {
        let header = `No${SEP}NIS${SEP}Nama Siswa${SEP}`;
        for (let i = 1; i <= daysInMonth; i++) header += `${i}${SEP}`;
        header += `H${SEP}S${SEP}I${SEP}A\n`;
        csvContent = header;

        reportData.forEach((row: any, idx) => {
          let line = `${idx + 1}${SEP}${row.nis}${SEP}"${row.name}"${SEP}`;
          for (let i = 1; i <= daysInMonth; i++) {
            line += `${row.dailyStats[i] || ''}${SEP}`;
          }
          line += `${row.h}${SEP}${row.s}${SEP}${row.i}${SEP}${row.a}\n`;
          csvContent += line;
        });
      }

      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'File Excel berhasil diunduh.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Gagal mengekspor data.', 'error');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Laporan & Rekap</h1>
          <p className="text-slate-500 font-medium">Cetak dan tinjau riwayat absensi.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button 
            onClick={handlePrint} 
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95 hover:bg-slate-800"
          >
            <Printer size={18} /> 
            <span className="hidden sm:inline">Cetak / Simpan PDF</span>
            <span className="sm:hidden text-xs">Print</span>
          </button>
          <button 
            onClick={exportToExcel} 
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95 hover:bg-emerald-700"
          >
            <FileSpreadsheet size={18} /> 
            <span className="hidden sm:inline">Excel</span>
            <span className="sm:hidden text-xs">Excel</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tipe Laporan</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setReportType('daily')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${reportType === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Harian</button>
              <button onClick={() => setReportType('monthly')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${reportType === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Bulanan</button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Pilih Kelas</label>
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih Kelas --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {reportType === 'daily' ? (
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tanggal</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Bulan</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                  {months.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tahun</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[48px] shadow-sm border border-slate-100 print:shadow-none print:border-0 print:p-0 container-print">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">LAPORAN ABSENSI DIGITAL SISWA TK</h2>
          <p className="text-slate-600 font-bold uppercase mt-1">KELAS: {selectedClass?.name || '-'}</p>
          <p className="text-slate-400 text-sm font-bold">
            {reportType === 'daily' ? `Tanggal: ${selectedDate}` : `Periode: ${months[selectedMonth - 1]} ${selectedYear}`}
          </p>
        </div>

        {reportType === 'daily' ? (
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-2 border-slate-300 px-4 py-3 text-center font-black text-slate-700 text-xs uppercase">No</th>
                <th className="border-2 border-slate-300 px-4 py-3 text-left font-black text-slate-700 text-xs uppercase">NIS</th>
                <th className="border-2 border-slate-300 px-4 py-3 text-left font-black text-slate-700 text-xs uppercase">Nama Siswa</th>
                <th className="border-2 border-slate-300 px-4 py-3 text-center font-black text-slate-700 text-xs uppercase">Status</th>
                <th className="border-2 border-slate-300 px-4 py-3 text-left font-black text-slate-700 text-xs uppercase">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row: any, idx) => (
                <tr key={row.id}>
                  <td className="border-2 border-slate-200 px-4 py-3 text-center text-slate-600 font-bold">{idx + 1}</td>
                  <td className="border-2 border-slate-200 px-4 py-3 text-slate-500 font-medium">{row.nis}</td>
                  <td className="border-2 border-slate-200 px-4 py-3 font-black text-slate-800">{row.name}</td>
                  <td className="border-2 border-slate-200 px-4 py-3 text-center">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                      String(row.status).toLowerCase().trim() === 'hadir' ? 'bg-emerald-100 text-emerald-700' : 
                      String(row.status).toLowerCase().trim() === 'izin' ? 'bg-amber-100 text-amber-700' : 
                      String(row.status).toLowerCase().trim() === 'sakit' ? 'bg-blue-100 text-blue-700' : 
                      String(row.status).toLowerCase().trim() === 'alpha' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="border-2 border-slate-200 px-4 py-3 text-sm italic text-slate-500">{row.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-100">
                  <th rowSpan={2} className="border border-slate-400 px-1 py-3 text-center font-black">NO</th>
                  <th rowSpan={2} className="border border-slate-400 px-2 py-3 text-left font-black">NIS</th>
                  <th rowSpan={2} className="border border-slate-400 px-2 py-3 text-left min-w-[150px] font-black">NAMA SISWA</th>
                  <th colSpan={daysInMonth} className="border border-slate-400 py-2 text-center font-black uppercase tracking-widest text-[8px]">TANGGAL</th>
                  <th colSpan={4} className="border border-slate-400 py-2 text-center font-black uppercase tracking-widest text-[8px]">REKAP</th>
                </tr>
                <tr className="bg-slate-50">
                  {[...Array(daysInMonth)].map((_, i) => (
                    <th key={i} className="border border-slate-400 w-6 text-center font-bold">{i + 1}</th>
                  ))}
                  <th className="border border-slate-400 w-8 text-center font-black text-emerald-600 bg-emerald-50">H</th>
                  <th className="border border-slate-400 w-8 text-center font-black text-blue-600 bg-blue-50">S</th>
                  <th className="border border-slate-400 w-8 text-center font-black text-amber-600 bg-amber-50">I</th>
                  <th className="border border-slate-400 w-8 text-center font-black text-red-600 bg-red-50">A</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row: any, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="border border-slate-300 px-1 font-medium text-slate-400">{row.nis}</td>
                    <td className="border border-slate-300 px-2 font-black text-slate-800 whitespace-nowrap">{row.name}</td>
                    {[...Array(daysInMonth)].map((_, i) => (
                      <td key={i} className="border border-slate-300 text-center font-bold text-[9px]">
                        {row.dailyStats[i + 1] === 'H' ? '✓' : (row.dailyStats[i + 1] || '')}
                      </td>
                    ))}
                    <td className="border border-slate-300 text-center font-black bg-emerald-50 text-emerald-700">{row.h}</td>
                    <td className="border border-slate-300 text-center font-black bg-blue-50 text-blue-700">{row.s}</td>
                    <td className="border border-slate-300 text-center font-black bg-amber-50 text-amber-700">{row.i}</td>
                    <td className="border border-slate-300 text-center font-black bg-red-50 text-red-700">{row.a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-20 grid grid-cols-2 gap-12 text-center signature-block">
          <div className="flex flex-col items-center">
            <div className="text-sm font-bold text-slate-800 mb-24 space-y-1">
              <p>Mengetahui</p>
              <p>Kepala Sekolah TK</p>
            </div>
            <div className="text-sm font-bold text-slate-800 space-y-1">
              <p className="mt-2 uppercase underline">{selectedClass?.headmasterName || '........................................'}</p>
              <p>NIP. {selectedClass?.headmasterNip || '-'}</p>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-sm font-bold text-slate-800 mb-24 space-y-1">
              <p>Ngariboyo, {reportType === 'daily' ? selectedDate : `${daysInMonth} ${months[selectedMonth-1]} ${selectedYear}`}</p>
              <p>Guru Kelas {selectedClass?.name || '-'}</p>
            </div>
            <div className="text-sm font-bold text-slate-800 space-y-1">
              <p className="mt-2 uppercase underline">{selectedClass?.teacherName || '........................................'}</p>
              <p>NIP. {selectedClass?.teacherNip || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportManager;