import React, { useState, useEffect } from 'react';
import api from '../api/axios';

interface SiteSetupDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string | number;
  onSuccess: () => void;
}

const SiteSetupDrawer: React.FC<SiteSetupDrawerProps> = ({ isOpen, onClose, siteId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [engineers, setEngineers] = useState<any[]>([]);
  
  // Site Config State
  const [startDate, setStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [notes, setNotes] = useState('');
  const [radius, setRadius] = useState(50);
  const [cutoffTime, setCutoffTime] = useState('09:30:00');

  // Engineer Assignment State
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [engStartDate, setEngStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [engEndDate, setEngEndDate] = useState('');
  const [engNotes, setEngNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [siteRes, usersRes, assignmentsRes] = await Promise.all([
        api.get(`/sites/sites/${siteId}/`),
        api.get('/users/'),
        api.get(`/sites/assignments/engineers/?site=${siteId}`)
      ]);
      
      const site = siteRes.data;
      setStartDate(site.start_date || '');
      setTargetEndDate(site.target_end_date || '');
      setStatus(site.status || 'Active');
      setNotes(site.notes || '');
      setRadius(site.geofence_radius_meters || 50);
      setCutoffTime(site.attendance_cutoff_time || '09:30:00');

      const allUsers = Array.isArray(usersRes.data.results) ? usersRes.data.results : (Array.isArray(usersRes.data) ? usersRes.data : []);
      setEngineers(allUsers.filter((u: any) => u.role === 'SITE_ENGINEER'));

      const engList = Array.isArray(assignmentsRes.data.results) ? assignmentsRes.data.results : (Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      if (engList.length > 0) {
        const latestAssignment = engList[engList.length - 1]; // Assume last is current
        setSelectedEngineer(String(latestAssignment.user));
        setEngStartDate(latestAssignment.start_date || '');
        setEngEndDate(latestAssignment.end_date || '');
        setEngNotes(latestAssignment.notes || '');
      } else {
        setSelectedEngineer('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Update Site Settings
      await api.patch(`/sites/sites/${siteId}/`, {
        start_date: startDate || null,
        target_end_date: targetEndDate || null,
        status: status,
        notes: notes,
        geofence_radius_meters: radius,
        attendance_cutoff_time: cutoffTime
      });

      // 2. Update/Create Site Engineer Assignment
      if (selectedEngineer) {
        await api.post('/sites/assignments/engineers/', {
          site: siteId,
          user: parseInt(selectedEngineer),
          start_date: engStartDate,
          end_date: engEndDate || null,
          notes: engNotes
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save site setup.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-container-lowest shrink-0">
          <h2 className="text-title-md font-bold text-text-main flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tune</span>
            Site Setup
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors text-text-muted">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-surface-bright space-y-8 custom-scrollbar">
          
          {/* Site Engineer Assignment */}
          <section>
            <h3 className="text-label-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">engineering</span>
              Site Engineer Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Select Site Engineer</label>
                <select 
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={selectedEngineer}
                  onChange={(e) => setSelectedEngineer(e.target.value)}
                >
                  <option value="">-- No Engineer Assigned --</option>
                  {engineers.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Assignment Start Date</label>
                <input 
                  type="date" 
                  value={engStartDate}
                  onChange={(e) => setEngStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Assignment End Date</label>
                <input 
                  type="date" 
                  value={engEndDate}
                  onChange={(e) => setEngEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Notes</label>
                <textarea 
                  value={engNotes}
                  onChange={(e) => setEngNotes(e.target.value)}
                  placeholder="Additional assignment notes..."
                  rows={2}
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </section>

          {/* Attendance Settings */}
          <section>
            <h3 className="text-label-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl">share_location</span>
              Attendance Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Attendance Radius (Meters)</label>
                <input 
                  type="number" 
                  min="10"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value) || 50)}
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Attendance Cutoff Time</label>
                <input 
                  type="time" 
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value)}
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </section>

          {/* Project Configuration */}
          <section>
            <h3 className="text-label-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-warning text-xl">event_available</span>
              Project Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Project Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Target End Date</label>
                <input 
                  type="date" 
                  value={targetEndDate}
                  onChange={(e) => setTargetEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Site Status</label>
                <select 
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </section>

          {/* Site Notes */}
          <section>
            <h3 className="text-label-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500 text-xl">sticky_note_2</span>
              Site Notes
            </h3>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Site-specific instructions or remarks..."
              rows={3}
              className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </section>

          {/* Summary Section */}
          <section className="bg-surface-container p-6 rounded-2xl border border-border-subtle">
            <h3 className="text-label-lg font-bold text-text-main mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Assigned Engineer</p>
                <p className="text-body-sm font-bold text-text-main truncate">
                  {selectedEngineer ? engineers.find(e => String(e.id) === selectedEngineer)?.full_name || 'Loading...' : 'None'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Attendance Radius</p>
                <p className="text-body-sm font-bold text-text-main">{radius} m</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Cutoff Time</p>
                <p className="text-body-sm font-bold text-text-main">{cutoffTime}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Site Status</p>
                <p className={`text-body-sm font-bold ${status === 'Active' ? 'text-green-600' : status === 'On Hold' ? 'text-warning' : 'text-primary'}`}>
                  {status}
                </p>
              </div>
            </div>
          </section>

        </div>

        <div className="p-6 border-t border-border-subtle bg-white shrink-0 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="px-6 py-3 text-text-muted font-bold hover:bg-surface-container rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/5 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Saving...' : 'Save Site Setup'}
          </button>
        </div>

      </div>
    </>
  );
};

export default SiteSetupDrawer;
