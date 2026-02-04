
import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { 
  Home, 
  Users, 
  School, 
  CalendarCheck, 
  FileBarChart, 
  Menu, 
  X, 
  LogOut,
  RefreshCw
} from 'lucide-react';
import { 
  ClassRoom, 
  Student, 
  AttendanceRecord, 
  ViewState
} from './types';
import Dashboard from './components/Dashboard';
import ClassManager from './components/ClassManager';
import StudentManager from './components/StudentManager';
import AttendanceForm from './components/AttendanceForm';
import ReportManager from './components/ReportManager';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to sync data from Supabase
  const syncData = useCallback(async (showToast = false) => {
    setIsSyncing(true);
    try {
      const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
      const { data: studentsData, error: studentsError } = await supabase.from('students').select('*');
      const { data: attendanceData, error: attendanceError } = await supabase.from('attendance').select('*');

      if (classesError) throw classesError;
      if (studentsError) throw studentsError;
      if (attendanceError) throw attendanceError;

      setClasses(classesData || []);
      setStudents(studentsData || []);
      setAttendance(attendanceData || []);
      
      if (showToast) {
        Swal.fire({
          icon: 'success',
          title: 'Data Disinkronkan',
          text: 'Database berhasil diperbarui.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (showToast) {
        Swal.fire('Error', 'Gagal menyinkronkan data.', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial Fetch on mount
  useEffect(() => {
    syncData();
  }, [syncData]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navigate = (view: ViewState) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Beranda', icon: <Home size={20} /> },
    { id: 'classes', label: 'Data Kelas', icon: <School size={20} /> },
    { id: 'students', label: 'Data Siswa', icon: <Users size={20} /> },
    { id: 'attendance', label: 'Absensi', icon: <CalendarCheck size={20} /> },
    { id: 'reports', label: 'Laporan', icon: <FileBarChart size={20} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 sticky top-0 h-screen no-print">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-xl text-white">
            <School size={24} />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-blue-600">Absensi TK</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
                : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          
          <button
            onClick={() => syncData(true)}
            disabled={isSyncing}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-indigo-600 hover:bg-indigo-50 mt-4 font-bold ${isSyncing ? 'opacity-50' : ''}`}
          >
            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronisasi'}</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium">
            <LogOut size={20} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 p-1.5 rounded-lg text-white">
            <School size={20} />
          </div>
          <span className="font-bold text-lg text-blue-600">Absensi Kita</span>
        </div>
        <div className="flex items-center gap-1">
          {isSyncing && <RefreshCw size={18} className="text-blue-500 animate-spin mr-2" />}
          <button onClick={toggleMobileMenu} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-40 flex flex-col p-6 no-print">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-800">Menu Navigasi</h2>
            <button onClick={toggleMobileMenu}><X size={24} /></button>
          </div>
          <nav className="space-y-4 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id as ViewState)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl ${
                  currentView === item.id ? 'bg-blue-500 text-white shadow-xl' : 'bg-slate-50 text-slate-600'
                }`}
              >
                {item.icon}
                <span className="font-bold text-lg">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => {
                syncData(true);
                setIsMobileMenuOpen(false);
              }}
              disabled={isSyncing}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 text-indigo-600 font-bold"
            >
              <RefreshCw size={24} className={isSyncing ? 'animate-spin' : ''} />
              <span className="text-lg">{isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Data'}</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Background Status Indicator */}
        {isSyncing && !isMobileMenuOpen && (
          <div className="fixed top-20 right-4 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm flex items-center gap-2 z-40 md:top-4 animate-in fade-in slide-in-from-top-2 no-print">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Data...</span>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {currentView === 'dashboard' && (
            <Dashboard classes={classes} students={students} attendance={attendance} />
          )}
          {currentView === 'classes' && (
            <ClassManager classes={classes} setClasses={setClasses} />
          )}
          {currentView === 'students' && (
            <StudentManager 
              students={students} 
              setStudents={setStudents} 
              classes={classes} 
            />
          )}
          {currentView === 'attendance' && (
            <AttendanceForm 
              classes={classes} 
              students={students} 
              attendance={attendance} 
              setAttendance={setAttendance} 
            />
          )}
          {currentView === 'reports' && (
            <ReportManager 
              classes={classes} 
              students={students} 
              attendance={attendance} 
            />
          )}
        </div>
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-30 no-print shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.slice(0, 3).map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.id as ViewState)}
            className={`flex flex-col items-center gap-1 ${
              currentView === item.id ? 'text-blue-500' : 'text-slate-400'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => navigate('attendance')}
          className={`flex flex-col items-center gap-1 ${
            currentView === 'attendance' ? 'text-blue-500' : 'text-slate-400'
          }`}
        >
          <CalendarCheck size={20} />
          <span className="text-[10px] font-bold">Absen</span>
        </button>
        <button
          onClick={() => syncData(true)}
          className={`flex flex-col items-center gap-1 ${
            isSyncing ? 'text-indigo-500' : 'text-slate-400'
          }`}
        >
          <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
          <span className="text-[10px] font-bold">Sinkron</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
