import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import ManualAttendanceModal from '../components/ManualAttendanceModal';

interface AttendanceLog {
  id: string;
  employee_name: string;
  employee_id: string;
  site_name: string;
  work_date: string;
  check_in_time: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half-day' | 'Pending' | 'Rejected';
  selfie_image: string | null;
  lat: number | null;
  lng: number | null;
}

const EmployeeAttendanceLogs = () => {
  const { user } = useAuth();
  const { activeSite } = useSite();
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterSite, setFilterSite] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const siteParam = activeSite?.id ? `?site=${activeSite.id}` : '';
      const res = await api.get(`/attendance/check-in/${siteParam}`);
      const data = Array.isArray(res.data.results) ? res.data.results : (Array.isArray(res.data) ? res.data : []);
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeSite?.id]);

  const filteredLogs = logs.filter(log => {
    if (filterDate && log.work_date !== filterDate) return false;
    
    if (filterSite) {
      const siteStr = log.site_name || '';
      if (!siteStr.toLowerCase().includes(filterSite.toLowerCase())) return false;
    }
    
    if (filterEmployee) {
      const empName = log.employee_name || '';
      const empId = log.employee_id || '';
      const query = filterEmployee.toLowerCase();
      if (!empName.toLowerCase().includes(query) && !empId.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    if (filterStatus && log.status !== filterStatus) return false;
    return true;
  });

  const handleExport = () => {
    // Basic CSV Export
    const headers = ['Employee Name', 'Employee ID', 'Date', 'Time', 'Site', 'Status', 'Lat', 'Lng'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + filteredLogs.map(e => `${e.employee_name},${e.employee_id || ''},${e.work_date},${e.check_in_time},${e.site_name},${e.status},${e.lat || ''},${e.lng || ''}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_logs.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-status-active/10 text-status-active border-status-active/20';
      case 'Late': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Half-day': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pending': return 'bg-surface-container-high text-text-muted border-border-subtle';
      case 'Rejected':
      case 'Absent': return 'bg-error-container text-error border-error/20';
      default: return 'bg-surface-container text-text-muted border-border-subtle';
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    const d = new Date(timeString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-bright p-container-padding overflow-y-auto">
      <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-headline-lg font-headline-lg text-text-main">{isAdminOrManager ? 'Attendance Logs' : 'My Attendance'}</h2>
            <p className="text-body-md text-text-muted">{isAdminOrManager ? 'Review smart attendance check-ins, verify selfies, and check GPS locations.' : 'View your attendance history, check-in times, and locations.'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isAdminOrManager && (
              <button 
                onClick={() => setShowManualModal(true)} 
                className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                Mark Manually
              </button>
            )}
            <button onClick={handleExport} className="bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5] px-4 py-2 rounded-xl font-bold hover:bg-[#FFEDD5] transition-all flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Export
            </button>
            <button onClick={fetchLogs} className="bg-white text-text-main px-4 py-2 rounded-xl font-bold border border-border-subtle hover:bg-surface-container-low transition-all flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-sm flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Date</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full px-3 py-2 border border-border-subtle rounded-lg text-body-sm" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Site</label>
            <input type="text" placeholder="Search site..." value={filterSite} onChange={e => setFilterSite(e.target.value)} className="w-full px-3 py-2 border border-border-subtle rounded-lg text-body-sm" />
          </div>
          {isAdminOrManager && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Employee</label>
              <input type="text" placeholder="Name or ID..." value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="w-full px-3 py-2 border border-border-subtle rounded-lg text-body-sm" />
            </div>
          )}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border border-border-subtle rounded-lg text-body-sm">
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half-day">Half-day</option>
              <option value="Absent">Absent</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left high-density-table">
              <thead className="border-b border-border-subtle bg-surface-container-lowest">
                <tr>
                  {isAdminOrManager && <th className="text-label-sm text-text-muted uppercase px-6 py-3">Employee</th>}
                  <th className="text-label-sm text-text-muted uppercase px-6 py-3">Date & Time</th>
                  <th className="text-label-sm text-text-muted uppercase px-6 py-3">Site</th>
                  <th className="text-label-sm text-text-muted uppercase px-6 py-3">Selfie</th>
                  <th className="text-label-sm text-text-muted uppercase px-6 py-3">Location</th>
                  <th className="text-label-sm text-text-muted uppercase px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr>
                    <td colSpan={isAdminOrManager ? 6 : 5} className="text-center py-10 text-text-muted">Loading logs...</td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={isAdminOrManager ? 6 : 5} className="text-center py-10 text-text-muted">No attendance logs found.</td>
                  </tr>
                ) : filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-surface-container-low transition-colors group">
                    {isAdminOrManager && (
                      <td className="px-6 py-4">
                        <p className="text-body-md font-bold text-text-main">{log.employee_name}</p>
                        {log.employee_id && <p className="text-[11px] text-text-muted">ID: {log.employee_id}</p>}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <p className="text-body-md font-bold text-text-main">{formatDate(log.work_date)}</p>
                      <p className="text-[11px] text-text-muted uppercase font-bold tracking-wider">{formatTime(log.check_in_time)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-text-muted">
                        <span className="material-symbols-outlined text-[16px]">apartment</span>
                        <span className="text-body-md">{log.site_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.selfie_image ? (
                        <a href={log.selfie_image} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 rounded-lg overflow-hidden border border-border-subtle hover:border-primary transition-all">
                          <img src={log.selfie_image} alt="Selfie" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-text-muted border border-border-subtle">
                          <span className="material-symbols-outlined">no_photography</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.lat && log.lng ? (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${log.lat},${log.lng}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-primary/5 hover:text-primary transition-colors text-text-muted text-label-sm"
                        >
                          <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                          View Map
                        </a>
                      ) : (
                        <span className="text-text-muted text-label-sm">No GPS</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {showManualModal && (
        <ManualAttendanceModal 
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setShowManualModal(false);
            fetchLogs();
          }}
        />
      )}
    </div>
  );
};

export default EmployeeAttendanceLogs;
