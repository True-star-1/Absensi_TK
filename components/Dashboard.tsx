
import React, { useMemo } from 'react';
import { 
  Users, 
  CheckCircle, 
  TrendingUp,
  CalendarCheck,
  Activity,
  UserX,
  HelpCircle,
  BarChart3,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Student, ClassRoom, AttendanceRecord } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardProps {
  students: Student[];
  classes: ClassRoom[];
  attendance: AttendanceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, classes, attendance }) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const stats = useMemo(() => {
    const totalStudents = students.length;
    
    // Helper untuk hitung status (Case-Insensitive)
    const getCount = (recs: AttendanceRecord[], status: string) => {
      const target = status.toLowerCase().trim();
      return recs.filter(a => a.status && String(a.status).toLowerCase().trim() === target).length;
    };

    // Statistik Harian
    const todayRecs = attendance.filter(a => a.date === todayStr);
    const hadirToday = getCount(todayRecs, 'Hadir');
    const sakitToday = getCount(todayRecs, 'Sakit');
    const izinToday = getCount(todayRecs, 'Izin');
    const alphaToday = getCount(todayRecs, 'Alpha');
    
    // Statistik Bulanan (Bulan Berjalan)
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthRecs = attendance.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const hadirMonth = getCount(monthRecs, 'Hadir');
    const totalMonthRecords = monthRecs.length;
    
    // Persentase
    const dailyRate = todayRecs.length > 0 ? Math.round((hadirToday / todayRecs.length) * 100) : 0;
    const monthlyRate = totalMonthRecords > 0 ? Math.round((hadirMonth / totalMonthRecords) * 100) : 0;

    return {
      total: totalStudents,
      today: { hadir: hadirToday, sakit: sakitToday, izin: izinToday, alpha: alphaToday, rate: dailyRate },
      monthly: { rate: monthlyRate, count: totalMonthRecords }
    };
  }, [students, attendance, todayStr]);

  const pieData = {
    labels: ['Hadir', 'Sakit', 'Izin', 'Alpha'],
    datasets: [
      {
        data: [stats.today.hadir, stats.today.sakit, stats.today.izin, stats.today.alpha],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 15
      },
    ],
  };

  const classData = {
    labels: classes.map(c => c.name),
    datasets: [
      {
        label: 'Jumlah Siswa',
        data: classes.map(c => students.filter(s => s.classId === c.id).length),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 12,
        hoverBackgroundColor: '#6366f1'
      },
    ],
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ringkasan Absensi</h1>
          <p className="text-slate-500 font-medium">Pantau kehadiran harian dan bulanan dengan mudah.</p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <CalendarCheck size={20} className="text-blue-500" />
          <span className="font-bold text-slate-700">{now.toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
        </div>
      </div>

      {/* Baris Utama Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Persentase Bulanan - Lebih Besar */}
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <CalendarDays className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Rata-rata Bulan Ini</p>
            <h2 className="text-5xl font-black mb-4">{stats.monthly.rate}%</h2>
            <div className="w-full bg-white/20 h-2 rounded-full mb-3">
              <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${stats.monthly.rate}%` }}></div>
            </div>
            <p className="text-[10px] font-bold opacity-70 italic">Dihitung dari total {stats.monthly.count} data absen bulan ini</p>
          </div>
        </div>

        {/* Persentase Harian */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-500"><TrendingUp size={20} /></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Kehadiran Hari Ini</p>
          </div>
          <h2 className="text-4xl font-black text-slate-900">{stats.today.rate}%</h2>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Status: {stats.today.rate >= 90 ? 'Sangat Baik' : 'Perlu Perhatian'}</p>
        </div>

        {/* Total Siswa */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-500"><Users size={20} /></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Anak Didik</p>
          </div>
          <h2 className="text-4xl font-black text-slate-900">{stats.total}</h2>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Terdaftar di database</p>
        </div>
      </div>

      {/* Rincian Status Hari Ini */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatDetail icon={<CheckCircle size={18} />} label="Hadir" value={stats.today.hadir} color="emerald" />
        <StatDetail icon={<Activity size={18} />} label="Sakit" value={stats.today.sakit} color="blue" />
        <StatDetail icon={<HelpCircle size={18} />} label="Izin" value={stats.today.izin} color="amber" />
        <StatDetail icon={<UserX size={18} />} label="Alpha" value={stats.today.alpha} color="red" />
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-500" /> Distribusi Kehadiran
            </h3>
            <span className="text-xs font-black text-slate-400 uppercase">Harian</span>
          </div>
          <div className="max-w-[280px] mx-auto">
            <Pie data={pieData} options={{ plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { weight: 'bold', size: 11 } } } } }} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-500" /> Siswa Per Kelas
            </h3>
            <span className="text-xs font-black text-slate-400 uppercase">Data Master</span>
          </div>
          <Bar 
            data={classData} 
            options={{ 
              responsive: true, 
              plugins: { legend: { display: false } }, 
              scales: { y: { beginAtZero: true, grid: { display: false }, ticks: { precision: 0 } }, x: { grid: { display: false } } } 
            }} 
          />
        </div>
      </div>
    </div>
  );
};

const StatDetail: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string }> = ({ icon, label, value, color }) => {
  const styles: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600'
  };
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex items-center gap-4 transition-transform hover:scale-105">
      <div className={`${styles[color]} p-2.5 rounded-xl`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
        <h4 className="text-xl font-black text-slate-800 leading-none">{value}</h4>
      </div>
    </div>
  );
};

export default Dashboard;
