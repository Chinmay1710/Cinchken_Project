import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import api from '../api/axios';
import LabourModal from '../components/LabourModal';
import WeeklyWagesModal from '../components/WeeklyWagesModal';
import GroupPhotosModal from '../components/GroupPhotosModal';
import type { Labour } from '../components/LabourModal';

const LabourManagement = () => {
  const { user } = useAuth();
  const { activeSite, unrestricted } = useSite();
  const [labourers, setLabourers] = useState<Labour[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent'>>({});
  const [isAttendanceLocked, setIsAttendanceLocked] = useState(false);
  
  // UI Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Present' | 'Absent'>('All');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLabour, setEditingLabour] = useState<Labour | undefined>(undefined);
  const [isWagesModalOpen, setIsWagesModalOpen] = useState(false);
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchLabourers = async () => {
    setLoading(true);
    try {
      const url = activeSite?.id ? `/labour/?site=${activeSite.id}` : '/labour/';
      const labourRes = await api.get(url);
      const labourData = Array.isArray(labourRes.data.results) ? labourRes.data.results : (Array.isArray(labourRes.data) ? labourRes.data : []);
      
      setLabourers(labourData);
      
      // Initialize attendance state to Absent by default for all workers
      const initialAttendance: Record<string, 'Present' | 'Absent'> = {};
      labourData.forEach((l: Labour) => {
        initialAttendance[l.id] = 'Absent';
      });
      setAttendanceState(initialAttendance);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDate = async () => {
    try {
      const url = activeSite?.id 
        ? `/labour/attendance/?site=${activeSite.id}&date=${attendanceDate}` 
        : `/labour/attendance/?date=${attendanceDate}`;
      const attRes = await api.get(url);
      const attendanceRecords = Array.isArray(attRes.data.results) ? attRes.data.results : (Array.isArray(attRes.data) ? attRes.data : []);
      
      if (attendanceRecords.length > 0) {
        setIsAttendanceLocked(true);
      } else {
        setIsAttendanceLocked(false);
      }
      
      setAttendanceState(prev => {
        const newState = { ...prev };
        attendanceRecords.forEach((record: any) => {
          newState[record.labour] = record.status;
        });
        return newState;
      });
    } catch (err) {
      console.error("Failed to fetch attendance records:", err);
    }
  };

  useEffect(() => {
    fetchLabourers().then(success => {
      if (success) fetchAttendanceForDate();
    });
  }, [activeSite?.id, attendanceDate]);

  const handleAdd = () => {
    setEditingLabour(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (labour: Labour) => {
    setEditingLabour(labour);
    setIsModalOpen(true);
  };

  const toggleAttendance = (labourId: string) => {
    if (isAttendanceLocked && user?.role !== 'ADMIN') return;
    setAttendanceState(prev => ({
      ...prev,
      [labourId]: prev[labourId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleSaveAttendance = async () => {
    if (!activeSite?.id) {
      alert("Please select a site to mark attendance against.");
      return;
    }

    const records = labourers.filter(l => l.status === 'Active').map(l => ({
      labour: l.id,
      status: attendanceState[l.id],
      sync_id: crypto.randomUUID()
    }));

    try {
      await api.post('/labour/attendance/bulk_mark/', {
        site: activeSite?.id,
        date: attendanceDate,
        attendances: records
      });
      alert("Attendance saved successfully!");
      setIsAttendanceLocked(true);
    } catch (err: any) {
      console.error(err);
      alert('Failed to submit attendance.');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!activeSite?.id) {
      alert("Please select a site first.");
      return;
    }
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('site', activeSite.id);

    setUploadingPhoto(true);
    try {
      await api.post('/labour/group-photos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Group photo uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload group photo.");
    } finally {
      setUploadingPhoto(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Derived KPIs
  const totalActive = labourers.filter(l => l.status === 'Active').length;
  const totalPresent = labourers.filter(l => l.status === 'Active' && attendanceState[l.id] === 'Present').length;
  const totalAbsent = totalActive - totalPresent;
  const totalWage = labourers.filter(l => l.status === 'Active' && attendanceState[l.id] === 'Present')
    .reduce((acc, curr) => acc + parseFloat(curr.daily_wage), 0);

  const displayedLabourers = labourers.filter(l => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!l.full_name?.toLowerCase().includes(q) && !l.labour_code?.toLowerCase().includes(q)) return false;
    }
    if (filterStatus !== 'All') {
      if (attendanceState[l.id] !== filterStatus) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-bright p-container-padding overflow-y-auto">
      <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-headline-lg font-headline-lg text-text-main">Labour Management</h2>
            <p className="text-body-md text-text-muted">Monitor attendance, daily wages, and workforce distribution across sites.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white px-4 py-2 rounded-xl border border-border-subtle flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">calendar_today</span>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Attendance Date</p>
                <input 
                  type="date" 
                  value={attendanceDate} 
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="text-body-md font-bold bg-transparent border-none p-0 focus:ring-0"
                />
              </div>
            </div>
            <button 
              onClick={handleAdd} 
              disabled={!activeSite?.id}
              title={!activeSite?.id ? "Please select a target site first" : ""}
              className="bg-surface-container-low text-text-main px-4 py-2 rounded-xl font-bold border border-border-subtle hover:bg-surface-container transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              Add Labourer
            </button>
            {(!isAttendanceLocked || user?.role === 'ADMIN') && (
              <button onClick={handleSaveAttendance} className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/5">
                <span className="material-symbols-outlined">save</span>
                {isAttendanceLocked ? 'Override Attendance' : 'Save Attendance'}
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle relative overflow-hidden group hover:border-primary-container transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary-container/10 rounded-lg text-primary-container">
                <span className="material-symbols-outlined">group</span>
              </div>
              <span className="text-text-muted text-label-sm font-bold">Total Active</span>
            </div>
            <p className="text-text-muted text-label-md">Total Labour</p>
            <p className="text-display font-display text-text-main">{totalActive}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle relative overflow-hidden group hover:border-status-active transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-status-active/10 rounded-lg text-status-active">
                <span className="material-symbols-outlined">person_check</span>
              </div>
              <span className="text-status-active text-label-sm font-bold">{totalActive > 0 ? Math.round((totalPresent / totalActive) * 100) : 0}% Capacity</span>
            </div>
            <p className="text-text-muted text-label-md">Present Today</p>
            <p className="text-display font-display text-text-main">{totalPresent}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle relative overflow-hidden group hover:border-error transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-error/10 rounded-lg text-error">
                <span className="material-symbols-outlined">person_off</span>
              </div>
            </div>
            <p className="text-text-muted text-label-md">Absent</p>
            <p className="text-display font-display text-text-main">{totalAbsent}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle relative overflow-hidden group hover:border-secondary transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <span className="text-text-muted text-label-sm font-bold">Estimated</span>
            </div>
            <p className="text-text-muted text-label-md">Today's Daily Wage</p>
            <p className="text-display font-display text-text-main">₹{totalWage.toLocaleString()}</p>
          </div>
        </div>
        )}

        {/* Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest">
            {/* Site Selector Removed - Using Global SiteContext */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                <input 
                  type="text" 
                  placeholder="Search labourer..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-lg text-body-md bg-white hover:bg-surface-container focus:bg-white transition-colors"
                />
              </div>

              <select 
                className="pl-4 pr-10 py-2 border border-border-subtle rounded-lg text-body-md font-medium bg-white hover:bg-surface-container transition-colors"
                value={filterStatus}
                onChange={(e: any) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Labourers</option>
                <option value="Present">Present Only</option>
                <option value="Absent">Absent Only</option>
              </select>
            </div>
            
            {/* New action buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsWagesModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg text-body-md font-bold shadow-sm hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                Calculate Wages
              </button>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  id="group-photo-upload" 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto || !activeSite}
                />
                <label 
                  htmlFor="group-photo-upload"
                  className={`flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md font-semibold text-text-main transition-colors ${(!activeSite || uploadingPhoto) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-container cursor-pointer'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  {uploadingPhoto ? 'Uploading...' : 'Upload Group Photo'}
                </label>
              </div>

              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <button 
                  onClick={() => setIsPhotosModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md font-semibold text-text-main hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_library</span>
                  View Photos
                </button>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left high-density-table">
              <thead className="border-b border-border-subtle bg-surface-container-lowest">
                <tr>
                  <th className="text-label-sm text-text-muted uppercase px-6 py-3">Labour ID</th>
                  <th className="text-label-sm text-text-muted uppercase px-6 py-3">Worker Details</th>
                  <th className="text-label-sm text-text-muted uppercase px-6 py-3">Category</th>
                  <th className="text-label-sm text-text-muted uppercase px-6 py-3">Status</th>
                  <th className="text-label-sm text-text-muted uppercase px-6 py-3">Attendance</th>
                  <th className="text-label-sm text-text-muted uppercase text-right px-6 py-3">Daily Wage</th>
                  <th className="text-label-sm text-text-muted uppercase text-center px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-text-muted">Loading labour records...</td>
                  </tr>
                ) : displayedLabourers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-text-muted">No labour records found matching criteria.</td>
                  </tr>
                ) : displayedLabourers.map(labour => (
                  <tr key={labour.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="font-mono text-label-md text-text-muted px-6 py-4">{labour.labour_code}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-[12px]">
                          {(labour.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-body-md font-bold text-text-main">{labour.full_name}</p>
                          <p className="text-[11px] text-text-muted">{labour.mobile_number || 'No Phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded uppercase border border-blue-100">
                        {labour.skill_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase border ${labour.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        {labour.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {labour.status === 'Active' && (
                        <div className={`flex items-center gap-4 ${(isAttendanceLocked && user?.role !== 'ADMIN') ? '' : 'cursor-pointer'}`} onClick={() => toggleAttendance(labour.id)}>
                          {(!isAttendanceLocked || user?.role === 'ADMIN') && (
                            <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${attendanceState[labour.id] === 'Present' ? 'bg-status-active' : 'bg-gray-300'}`}>
                              <div className={`w-5 h-5 rounded-full bg-white absolute transition-transform ${attendanceState[labour.id] === 'Present' ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                            </div>
                          )}
                          {(isAttendanceLocked && user?.role !== 'ADMIN') && (
                            <span className="material-symbols-outlined text-[16px] text-text-muted">lock</span>
                          )}
                          <span className={`text-body-md font-medium ${attendanceState[labour.id] === 'Present' ? 'text-status-active' : 'text-error'}`}>
                            {attendanceState[labour.id]}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="text-body-md font-bold text-text-main text-right px-6 py-4">₹{labour.daily_wage}</td>
                    <td className="text-center px-6 py-4">
                      <button onClick={() => handleEdit(labour)} className="text-text-muted hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <LabourModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLabour(undefined);
        }}
        onSave={() => {
          setIsModalOpen(false);
          fetchLabourers();
        }}
        labour={editingLabour}
        siteId={activeSite?.id || ''}
      />

      <WeeklyWagesModal 
        isOpen={isWagesModalOpen}
        onClose={() => setIsWagesModalOpen(false)}
      />

      <GroupPhotosModal 
        isOpen={isPhotosModalOpen}
        onClose={() => setIsPhotosModalOpen(false)}
        siteId={activeSite?.id || ''}
      />
    </div>
  );
};

export default LabourManagement;
