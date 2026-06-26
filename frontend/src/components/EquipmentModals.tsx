import React, { useState } from 'react';
import api from '../api/axios';
import { useSite } from '../context/SiteContext';

export const EquipmentModal = ({ isOpen, onClose, onSuccess }: any) => {
  const [name, setName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/equipment/list/', {
        name,
        supplier_name: supplierName,
        description
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error creating equipment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high">
          <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">precision_manufacturing</span>
            Add Equipment
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-text-muted hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="equipmentForm" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-label-md font-medium text-text-muted ml-1">Equipment Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface" placeholder="e.g. JCB Backhoe Loader" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-label-md font-medium text-text-muted ml-1">Supplier Name</label>
              <input type="text" value={supplierName} onChange={e => setSupplierName(e.target.value)} className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface" placeholder="e.g. ABC Rentals" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-label-md font-medium text-text-muted ml-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface resize-none" rows={3} placeholder="Additional details..." />
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-high">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-semibold text-text-muted hover:bg-surface-container-highest hover:text-on-surface transition-all">Cancel</button>
          <button type="submit" form="equipmentForm" className="px-8 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-md">Add Equipment</button>
        </div>
      </div>
    </div>
  );
};

export const EquipmentLogModal = ({ isOpen, onClose, onSuccess, equipments }: any) => {
  const { activeSite } = useSite();
  const [equipmentId, setEquipmentId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [remarks, setRemarks] = useState('');

  // Auto-calculate total hours when start or end time changes
  React.useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);
      let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      // Handle cases where end time is past midnight
      if (diff < 0) {
        diff += 24;
      }
      
      setTotalHours(diff.toFixed(1));
    }
  }, [startTime, endTime]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSite) {
      alert("Please select a site first");
      return;
    }
    try {
      await api.post('/equipment/logs/', {
        site: activeSite.id,
        equipment: equipmentId,
        date,
        start_time: startTime || null,
        end_time: endTime || null,
        total_hours: parseFloat(totalHours),
        remarks
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error logging equipment usage');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high">
          <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">more_time</span>
            Log Equipment Usage
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-text-muted hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="logForm" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-label-md font-medium text-text-muted ml-1">Equipment *</label>
              <select value={equipmentId} onChange={e => setEquipmentId(e.target.value)} required className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface appearance-none">
                <option value="">Select Equipment...</option>
                {equipments.map((eq: any) => (
                  <option key={eq.id} value={eq.id}>{eq.name} {eq.supplier_name ? `(${eq.supplier_name})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-label-md font-medium text-text-muted ml-1">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-medium text-text-muted ml-1">Start Time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-medium text-text-muted ml-1">End Time</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-label-md font-medium text-text-muted ml-1">Total Hours *</label>
              <input type="number" step="0.1" value={totalHours} onChange={e => setTotalHours(e.target.value)} required className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface" placeholder="e.g. 8.5" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-label-md font-medium text-text-muted ml-1">Remarks</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface resize-none" rows={2} placeholder="Reason or remarks..." />
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-high">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-semibold text-text-muted hover:bg-surface-container-highest hover:text-on-surface transition-all">Cancel</button>
          <button type="submit" form="logForm" className="px-8 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-md">Log Usage</button>
        </div>
      </div>
    </div>
  );
};

export const DieselLogModal = ({ isOpen, onClose, onSuccess, equipments }: any) => {
  const { activeSite } = useSite();
  const [formData, setFormData] = useState({
    equipment: '',
    date: new Date().toISOString().split('T')[0],
    liters_consumed: '',
    slip_number: '',
    issued_by: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSite) {
      alert("Please select a site first.");
      return;
    }
    try {
      await api.post('/equipment/diesel-logs/', { ...formData, site: activeSite.id });
      onSuccess();
      onClose();
      setFormData({
        equipment: '', date: new Date().toISOString().split('T')[0],
        liters_consumed: '', slip_number: '', issued_by: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to save diesel log.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-border-subtle">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface">
          <h2 className="text-title-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-error">local_gas_station</span> Log Diesel Usage
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-sm font-bold text-text-muted mb-1">Equipment</label>
              <select
                required
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={formData.equipment}
                onChange={e => setFormData({ ...formData, equipment: e.target.value })}
              >
                <option value="">Select Equipment</option>
                {equipments.filter((e:any) => e.is_active).map((eq: any) => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm font-bold text-text-muted mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-label-sm font-bold text-text-muted mb-1">Liters Consumed</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50"
                  className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={formData.liters_consumed}
                  onChange={e => setFormData({ ...formData, liters_consumed: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-label-sm font-bold text-text-muted mb-1">Slip / Receipt Number (Optional)</label>
              <input
                type="text"
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={formData.slip_number}
                onChange={e => setFormData({ ...formData, slip_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-text-muted mb-1">Issued By (Optional)</label>
              <input
                type="text"
                placeholder="Name of person"
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={formData.issued_by}
                onChange={e => setFormData({ ...formData, issued_by: e.target.value })}
              />
            </div>
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold text-text-muted bg-surface-container-low hover:bg-surface-container-high transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary hover:opacity-90 transition-opacity shadow-md">Save Diesel Log</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
