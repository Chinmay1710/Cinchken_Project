import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Site } from '../pages/SiteManagement';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface ManualAttendanceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({ onClose, onSuccess }) => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    employee_id: '',
    site: '',
    work_date: new Date().toISOString().split('T')[0],
    status: 'Present',
    is_manual: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, siteRes] = await Promise.all([
          api.get('/users/'),
          api.get('/sites/')
        ]);
        
        const allUsers = Array.isArray(empRes.data.results) ? empRes.data.results : (Array.isArray(empRes.data) ? empRes.data : []);
        setEmployees(allUsers.filter((u: any) => u.role === 'EMPLOYEE' || u.role === 'SITE_ENGINEER'));
        
        const allSites = Array.isArray(siteRes.data.results) ? siteRes.data.results : (Array.isArray(siteRes.data) ? siteRes.data : []);
        setSites(allSites);
        
        if (allSites.length > 0) {
          setFormData(prev => ({ ...prev, site: allSites[0].id }));
        }
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.site) {
      alert("Please select employee and site.");
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/attendance/check-in/', formData);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to mark attendance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-container-lowest">
          <h2 className="text-title-lg font-bold text-text-main flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_calendar</span>
            Manual Check-In
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-text-muted">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="manualForm" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-label-md font-bold text-text-muted mb-1">Employee</label>
              <select
                required
                className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
                value={formData.employee_id}
                onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
              >
                <option value="">Select Employee...</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.full_name || e.email} ({e.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-label-md font-bold text-text-muted mb-1">Site</label>
              <select
                required
                className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
                value={formData.site}
                onChange={e => setFormData({ ...formData, site: e.target.value })}
              >
                <option value="">Select Site...</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md font-bold text-text-muted mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  value={formData.work_date}
                  onChange={e => setFormData({ ...formData, work_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-label-md font-bold text-text-muted mb-1">Status</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half-day">Half-day</option>
                  <option value="Absent">Absent</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border-subtle bg-surface-container-lowest flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2.5 rounded-full font-bold text-text-main hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="manualForm" 
            disabled={loading}
            className="px-6 py-2.5 rounded-full font-bold bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-colors flex items-center gap-2"
          >
            {loading ? 'Submitting...' : 'Mark Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualAttendanceModal;
