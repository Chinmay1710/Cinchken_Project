import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSite } from '../context/SiteContext';

interface WeeklyWagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WageRecord {
  id: string;
  labour_code: string;
  full_name: string;
  skill_type: string;
  daily_wage: number;
  payable_days: number;
  total_wage: number;
  status: string;
}

const WeeklyWagesModal: React.FC<WeeklyWagesModalProps> = ({ isOpen, onClose }) => {
  const { activeSite, assignedSites } = useSite();
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(activeSite?.id || null);
  
  // Default to last 7 days including today
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  
  const [records, setRecords] = useState<WageRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (activeSite?.id) {
        setSelectedSiteId(activeSite.id);
      } else if (!selectedSiteId && assignedSites.length > 0) {
        setSelectedSiteId(assignedSites[0].id);
      }
    }
  }, [isOpen, activeSite, assignedSites]);

  useEffect(() => {
    if (isOpen && selectedSiteId) {
      fetchWages();
    }
  }, [isOpen, selectedSiteId, startDate, endDate]);

  const fetchWages = async () => {
    if (!selectedSiteId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/labour/weekly_wages/?site=${selectedSiteId}&start_date=${startDate}&end_date=${endDate}`);
      setRecords(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to fetch wage data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['Labour ID', 'Name', 'Category', 'Status', 'Daily Wage', 'Payable Days', 'Total Wage'];
    const csvContent = [
      headers.join(','),
      ...records.map(r => 
        `"${r.labour_code}","${r.full_name}","${r.skill_type}","${r.status}",${r.daily_wage},${r.payable_days},${r.total_wage}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const siteObj = assignedSites.find(s => s.id === selectedSiteId);
    link.setAttribute("download", `Weekly_Wages_${siteObj?.name?.replace(/\s+/g, '_') || 'Global'}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const totalWages = records.reduce((sum, r) => sum + r.total_wage, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-bright rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-border-subtle animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div>
            <h2 className="text-title-lg font-bold text-text-main">Weekly Wages Calculation</h2>
            <p className="text-body-sm text-text-muted mt-1">
              Project: <strong className="text-text-main">{assignedSites.find(s => s.id === selectedSiteId)?.name || 'No Site Selected'}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-main hover:bg-surface-container rounded-lg transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 bg-surface-container-lowest border-b border-border-subtle flex flex-wrap gap-6 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-label-sm font-bold text-text-muted mb-1 uppercase tracking-tight">Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 bg-white border border-border-subtle rounded-xl text-body-md font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-text-muted mb-1 uppercase tracking-tight">End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 bg-white border border-border-subtle rounded-xl text-body-md font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-label-sm font-bold text-text-muted mb-1 uppercase tracking-tight">Project Site</label>
              <select 
                value={selectedSiteId || ''}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="px-4 py-2 bg-white border border-border-subtle rounded-xl text-body-md font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all max-w-[200px] truncate"
              >
                {!selectedSiteId && <option value="" disabled>Select a site...</option>}
                {assignedSites.map((site: any) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <p className="text-label-sm font-bold text-text-muted uppercase tracking-tight">Total Payout</p>
              <p className="text-headline-sm font-display font-bold text-primary">₹{totalWages.toLocaleString()}</p>
            </div>
            <button 
              onClick={handleDownloadCSV}
              disabled={records.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-white rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Export CSV
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-bright">
          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined">error</span>
              <p className="font-medium">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-text-muted">
              <span className="material-symbols-outlined animate-spin text-[40px] mb-4 text-primary">sync</span>
              <p className="text-body-lg font-medium">Calculating wages based on attendance...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-text-muted">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-20">payments</span>
              <p className="text-body-lg font-medium">No labour records found for this period.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border-subtle overflow-hidden">
              <table className="w-full text-left high-density-table">
                <thead className="bg-surface-container-low border-b border-border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-label-sm font-bold text-text-muted uppercase tracking-tight">Labour ID</th>
                    <th className="px-4 py-3 text-label-sm font-bold text-text-muted uppercase tracking-tight">Name</th>
                    <th className="px-4 py-3 text-label-sm font-bold text-text-muted uppercase tracking-tight">Category</th>
                    <th className="px-4 py-3 text-label-sm font-bold text-text-muted uppercase tracking-tight text-right">Daily Wage</th>
                    <th className="px-4 py-3 text-label-sm font-bold text-text-muted uppercase tracking-tight text-right">Payable Days</th>
                    <th className="px-4 py-3 text-label-sm font-bold text-text-muted uppercase tracking-tight text-right">Total Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {records.map(record => (
                    <tr key={record.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-4 py-3 font-mono text-body-sm text-text-muted">{record.labour_code}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${record.status === 'Active' ? 'bg-status-active' : 'bg-error'}`}></span>
                          <span className="font-bold text-text-main">{record.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded uppercase border border-blue-100">
                          {record.skill_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-body-md text-text-muted">₹{record.daily_wage}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-surface-container rounded-lg font-bold text-text-main">
                          {record.payable_days}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-display font-bold text-primary text-body-lg">
                        ₹{record.total_wage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyWagesModal;
