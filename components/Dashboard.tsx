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

// Set default font for all charts to match the UI (Quicksand)
ChartJS.defaults.font.family = "'Quicksand', sans-serif";

interface DashboardProps {
  students: Student[];
  classes: ClassRoom[];
  attendance: AttendanceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, classes, attendance }) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Mengurutkan kelas secara alfabetis (TK A sebelum TK B)
  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => a.name.localeCompare(b.name));
  }, [classes]);

  const stats = useMemo(() => {
    const totalStudents = students.length;
    
    // Fungsi hitung yang lebih robust untuk menangani perbedaan kapitalisasi dari database
    const getCount = (recs: AttendanceRecord[], status: string) => {
      const target = status.toLowerCase().trim();
      return recs.filter(a => {
        if (!a.status) return false;
        return String(a.status).toLowerCase().trim() === target;
      }).length;
    };

    const todayRecs = attendance.filter(a => a.date === todayStr);
    const hadirToday = getCount(todayRecs, 'Hadir');
    const sakitToday = getCount(todayRecs, 'Sakit');
    const izinToday = getCount(todayRecs, 'Izin');
    const alphaToday = getCount(todayRecs, 'Alpha');
    
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthRecs = attendance.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const hadirMonth = getCount(monthRecs, 'Hadir');
    const totalMonthRecords = monthRecs.length;
    
    const dailyRate = todayRecs.length > 0 ? Math.round((hadirToday / todayRecs.length) * 100) : 0;
    const monthlyRate = totalMonthRecords > 0 ? Math.round((hadirMonth / totalMonthRecords) * 100) : 0;

    const classBreakdown = sortedClasses.map(c => ({
      name: c.name,
      count: students.filter(s => s.classId === c.id).length
    }));

    return {
      total: totalStudents,
      classBreakdown,
      today: { hadir: hadirToday, sakit: sakitToday, izin: izinToday, alpha: alphaToday, rate: dailyRate },
      monthly: { rate: monthlyRate, count: totalMonthRecords }
    };
  }, [students, sortedClasses, attendance, todayStr]);

  const isTodayEmpty = stats.today.hadir === 0 && stats.today.sakit === 0 && stats.today.izin === 0 && stats.today.alpha === 0;

  const pieData = {
    labels: isTodayEmpty ? ['Belum Ada Data'] : ['Hadir', 'Sakit', 'Izin', 'Alpha'],
    datasets: [
      {
        data: isTodayEmpty ? [1] : [stats.today.hadir, stats.today.sakit, stats.today.izin, stats.today.alpha],
        backgroundColor: isTodayEmpty ? ['#f1f5f9'] : ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        hoverOffset: isTodayEmpty ? 0 : 15
      },
    ],
  };

  const classData = {
    labels: sortedClasses.map(c => c.name),
    datasets: [
      {
        label: 'Jumlah Siswa',
        data: sortedClasses.map(c => students.filter(s => s.classId === c.id).length),
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <CalendarDays className="absolute -right-4 -bottom-4 w-40 h-40 opacity-10" />
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Rata-rata Bulan Ini</p>
            <h2 className="text-6xl font-black mb-6">{stats.monthly.rate}%</h2>
            <div className="w-full bg-white/20 h-3 rounded-full mb-4">
              <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${stats.monthly.rate}%` }}></div>
            </div>
            <p className="text-[11px] font-bold opacity-70 italic tracking-wide">Dihitung dari total {stats.monthly.count} data absen bulan ini</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-500"><TrendingUp size={22} /></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Kehadiran Hari Ini</p>
          </div>
          <h2 className="text-5xl font-black text-slate-900">{stats.today.rate}%</h2>
          <div className="mt-3 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stats.today.rate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-tight">Status: {stats.today.rate >= 90 ? 'Sangat Baik' : 'Perlu Perhatian'}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-500"><Users size={22} /></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Anak Didik</p>
          </div>
          <h2 className="text-6xl font-black text-slate-900 leading-tight tracking-tighter">{stats.total}</h2>
          
          <div className="flex flex-wrap gap-2.5 mt-4">
            {stats.classBreakdown.map(cb => (
              <div key={cb.name} className="bg-blue-50/80 border border-blue-100 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm hover:scale-105 transition-transform">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{cb.name}</span>
                <span className="text-xl font-black text-blue-600 leading-none">{cb.count}</span>
              </div>
            ))}
          </div>
          
          <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-4">Terdaftar di database</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatDetail icon={<CheckCircle size={20} />} label="Hadir" value={stats.today.hadir} color="emerald" />
        <StatDetail icon={<Activity size={20} />} label="Sakit" value={stats.today.sakit} color="blue" />
        <StatDetail icon={<HelpCircle size={20} />} label="Izin" value={stats.today.izin} color="amber" />
        <StatDetail icon={<UserX size={20} />} label="Alpha" value={stats.today.alpha} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <Sparkles size={24} className="text-indigo-500" /> Distribusi Kehadiran
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori Hari Ini</span>
          </div>
          <div className="max-w-[300px] mx-auto py-4">
            <Pie 
              data={pieData} 
              options={{ 
                plugins: { 
                  legend: { 
                    display: !isTodayEmpty,
                    position: 'bottom', 
                    labels: { 
                      usePointStyle: true, 
                      padding: 20,
                      font: { weight: 'bold', size: 12, family: "'Quicksand', sans-serif" } 
                    } 
                  },
                  tooltip: {
                    enabled: !isTodayEmpty,
                    titleFont: { weight: 'bold', family: "'Quicksand', sans-serif" },
                    bodyFont: { family: "'Quicksand', sans-serif" }
                  }
                } 
              }} 
            />
            {isTodayEmpty && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-300">
                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 border-dashed">
                  <Activity size={40} />
                </div>
                <p className="text-center text-xs font-black uppercase tracking-widest italic">Belum ada data absensi</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <BarChart3 size={24} className="text-indigo-500" /> Siswa Per Kelas
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Perbandingan Antar Kelas</span>
          </div>
          <div className="py-4">
            <Bar 
              data={classData} 
              options={{ 
                responsive: true, 
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    titleFont: { weight: 'bold', family: "'Quicksand', sans-serif" },
                    bodyFont: { family: "'Quicksand', sans-serif" }
                  }
                }, 
                scales: { 
                  y: { 
                    beginAtZero: true, 
                    grid: { display: false }, 
                    ticks: { precision: 0, font: { weight: 'bold', family: "'Quicksand', sans-serif" } } 
                  }, 
                  x: { 
                    grid: { display: false },
                    ticks: { font: { weight: 'bold', family: "'Quicksand', sans-serif" } }
                  } 
                } 
              }} 
            />
          </div>
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
    <div className="bg-white p-5 rounded-2xl border border-slate-50 shadow-sm flex items-center gap-5 transition-transform hover:scale-105 cursor-default">
      <div className={`${styles[color]} p-3 rounded-2xl`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <h4 className="text-2xl font-black text-slate-800 leading-none tracking-tight">{value}</h4>
      </div>
    </div>
  );
};

export default Dashboard;