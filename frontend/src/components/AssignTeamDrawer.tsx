import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import type { Site } from '../pages/SiteManagement';

interface AssignTeamDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  site: Site | null;
  onSuccess?: () => void;
}

const AssignTeamDrawer: React.FC<AssignTeamDrawerProps> = ({ isOpen, onClose, site, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'engineer' | 'employees' | 'settings'>('engineer');
  
  // Data States
  const [engineers, setEngineers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Form States
  const [selectedEngineers, setSelectedEngineers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [radius, setRadius] = useState('50');
  const [cutoffTime, setCutoffTime] = useState('09:30');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/');
      const users = Array.isArray(res.data.results) ? res.data.results : (Array.isArray(res.data) ? res.data : []);
      setEngineers(users.filter((u: any) => u.role === 'SITE_ENGINEER'));
      setEmployees(users.filter((u: any) => u.role === 'EMPLOYEE'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignEngineer = async () => {
    if (!site || selectedEngineers.length === 0 || !startDate) return;
    try {
      for (const engId of selectedEngineers) {
        await api.post('/sites/assignments/engineers/', {
          site: site.id,
          user: engId,
          start_date: startDate,
          end_date: endDate || null,
          notes
        });
      }
      alert('Engineers assigned successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to assign engineers.');
    }
  };

  const handleAssignEmployees = async () => {
    if (!site || selectedEmployees.length === 0) return;
    try {
      for (const empId of selectedEmployees) {
        await api.post('/sites/assignments/', {
          site_id: site.id,
          user: empId
        });
      }
      alert('Employees assigned successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to assign employees.');
    }
  };

  const handleSaveSettings = async () => {
    if (!site) return;
    try {
      await api.post('/sites/settings/', {
        site: site.id,
        attendance_radius: parseInt(radius),
        cutoff_time: cutoffTime
      });
      alert('Settings saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    }
  };

  if (!isOpen || !site) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[500px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-container-lowest">
          <div>
            <h2 className="text-title-lg font-bold text-text-main">Assign Team</h2>
            <p className="text-body-md text-text-muted mt-1">{site.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors text-text-muted">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle bg-surface-container-lowest px-6">
          <button 
            className={`py-4 font-bold text-label-md border-b-2 mr-6 transition-colors ${activeTab === 'engineer' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
            onClick={() => setActiveTab('engineer')}
          >
            Site Engineer
          </button>
          <button 
            className={`py-4 font-bold text-label-md border-b-2 mr-6 transition-colors ${activeTab === 'employees' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
            onClick={() => setActiveTab('employees')}
          >
            Employees
          </button>
          <button 
            className={`py-4 font-bold text-label-md border-b-2 transition-colors ${activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-bright">
          
          {activeTab === 'engineer' && (
            <div className="space-y-5">
              <div>
                <label className="block text-label-sm font-bold text-text-muted uppercase tracking-wider mb-2">Select Engineers</label>
                <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
                  <div className="max-h-[200px] overflow-y-auto divide-y divide-border-subtle">
                    {engineers.map(eng => (
                      <label key={eng.id} className="flex items-center gap-3 p-4 hover:bg-surface-container-low cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={selectedEngineers.includes(eng.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedEngineers([...selectedEngineers, eng.id]);
                            else setSelectedEngineers(selectedEngineers.filter(id => id !== eng.id));
                          }}
                          className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary"
                        />
                        <div>
                          <p className="text-body-md font-bold text-text-main">{eng.full_name}</p>
                          <p className="text-[12px] text-text-muted">{eng.mobile_number} • {eng.department || 'No Dept'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm font-bold text-text-muted uppercase tracking-wider mb-2">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-white text-body-md font-medium" />
                </div>
                <div>
                  <label className="block text-label-sm font-bold text-text-muted uppercase tracking-wider mb-2">End Date (Optional)</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-white text-body-md font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-label-sm font-bold text-text-muted uppercase tracking-wider mb-2">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-white text-body-md" placeholder="Add assignment notes..."></textarea>
              </div>
              <button onClick={handleAssignEngineer} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/5">
                Assign {selectedEngineers.length} Engineers
              </button>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-5">
              <div>
                <label className="block text-label-sm font-bold text-text-muted uppercase tracking-wider mb-2">Select Employees</label>
                <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-border-subtle">
                    {employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-3 p-4 hover:bg-surface-container-low cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedEmployees([...selectedEmployees, emp.id]);
                            else setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                          }}
                          className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary"
                        />
                        <div>
                          <p className="text-body-md font-bold text-text-main">{emp.full_name}</p>
                          <p className="text-[12px] text-text-muted">{emp.designation || 'No Designation'} • {emp.department || 'No Dept'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleAssignEmployees} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/5">
                Assign {selectedEmployees.length} Employees
              </button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div>
                <label className="block text-label-sm font-bold text-text-muted uppercase tracking-wider mb-2">Attendance Radius (Meters)</label>
                <input type="number" value={radius} onChange={e => setRadius(e.target.value)} className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-white text-body-md font-medium" />
                <p className="text-xs text-text-muted mt-2">Employees must be within this radius to mark attendance.</p>
              </div>
              <div>
                <label className="block text-label-sm font-bold text-text-muted uppercase tracking-wider mb-2">Cutoff Time</label>
                <input type="time" value={cutoffTime} onChange={e => setCutoffTime(e.target.value)} className="w-full px-4 py-3 border border-border-subtle rounded-xl bg-white text-body-md font-medium" />
                <p className="text-xs text-text-muted mt-2">Attendance marked after this time will be flagged as Late.</p>
              </div>
              <button onClick={handleSaveSettings} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/5">
                Save Settings
              </button>
            </div>
          )}
          
        </div>
      </div>
    </>
  );
};

export default AssignTeamDrawer;
