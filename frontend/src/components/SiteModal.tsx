import { useState, useEffect } from 'react';
import api from '../api/axios';
import type { Site } from '../pages/SiteManagement';

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  site?: Site;
}

const SiteModal: React.FC<SiteModalProps> = ({ isOpen, onClose, onSave, site }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    geofence_radius_meters: 50,
    attendance_cutoff_time: '09:00:00',
    start_date: '',
    target_date: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        address: site.address,
        latitude: site.latitude,
        longitude: site.longitude,
        geofence_radius_meters: site.geofence_radius_meters,
        attendance_cutoff_time: site.attendance_cutoff_time,
        start_date: site.start_date || '',
        target_date: site.target_date || '',
        is_active: site.is_active
      });
    } else {
      setFormData({
        name: '',
        address: '',
        latitude: 0,
        longitude: 0,
        geofence_radius_meters: 50,
        attendance_cutoff_time: '09:00:00',
        start_date: '',
        target_date: '',
        is_active: true
      });
    }
    setError('');
  }, [site, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = { ...formData };
      if (!payload.start_date) payload.start_date = null as any;
      if (!payload.target_date) payload.target_date = null as any;

      if (site) {
        await api.patch(`/sites/${site.id}/`, payload);
      } else {
        await api.post('/sites/', payload);
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save site.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-surface flex-shrink-0">
          <h3 className="text-headline-md font-bold text-on-surface">
            {site ? 'Edit Site' : 'Add Site'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full text-text-muted">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {error && <div className="p-3 bg-error-container text-on-error-container rounded-lg text-label-md">{error}</div>}
          
          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1">Site Name</label>
            <input 
              required 
              type="text" 
              className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1">Address</label>
            <textarea 
              required 
              rows={2}
              className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Latitude</label>
              <input 
                required 
                type="number" 
                step="any"
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.latitude}
                onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Longitude</label>
              <input 
                required 
                type="number" 
                step="any"
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.longitude}
                onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Radius (Meters)</label>
              <input 
                required 
                type="number" 
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.geofence_radius_meters}
                onChange={(e) => setFormData({...formData, geofence_radius_meters: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Cutoff Time</label>
              <input 
                required 
                type="time" 
                step="1"
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.attendance_cutoff_time}
                onChange={(e) => setFormData({...formData, attendance_cutoff_time: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Target Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.target_date}
                onChange={(e) => setFormData({...formData, target_date: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="is_active_site" 
              className="w-4 h-4 text-primary rounded border-border-subtle focus:ring-primary"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
            />
            <label htmlFor="is_active_site" className="text-body-md text-on-surface">Active Site</label>
          </div>

          <div className="pt-6 flex gap-3 justify-end flex-shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-border-subtle font-bold text-text-muted hover:bg-surface-container-low transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold shadow-sm hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? 'Saving...' : 'Save Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SiteModal;
