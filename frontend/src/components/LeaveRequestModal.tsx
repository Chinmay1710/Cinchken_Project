import React, { useState } from 'react';
import api from '../api/axios';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ isOpen, onClose, onSuccess, employeeId }) => {
  const [leaveType, setLeaveType] = useState('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-CA');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setError('Please fill all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/hr/leaves/', {
        employee: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center">
          <h2 className="text-title-lg font-bold text-text-main">Request Time Off</h2>
          <button onClick={onClose} className="text-text-muted hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-error-container text-error rounded-lg text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface-variant mb-1">Leave Type</label>
              <select 
                value={leaveType} 
                onChange={e => setLeaveType(e.target.value)}
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-primary focus:border-primary"
              >
                <option value="Annual">Annual Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md font-bold text-on-surface-variant mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  min={today}
                  required
                  className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-label-md font-bold text-on-surface-variant mb-1">End Date</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  min={startDate || today}
                  required
                  className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-label-md font-bold text-on-surface-variant mb-1">Reason</label>
              <textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Briefly explain your reason..."
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-primary focus:border-primary resize-none"
              ></textarea>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2 text-primary font-bold hover:bg-surface-container-low rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestModal;
