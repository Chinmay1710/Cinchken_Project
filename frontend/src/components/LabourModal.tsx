import { useState, useEffect } from 'react';
import api from '../api/axios';

export interface Labour {
  id: string;
  labour_code: string;
  full_name: string;
  mobile_number: string | null;
  skill_type: string;
  daily_wage: string;
  status: string;
}

interface LabourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  labour?: Labour;
  siteId?: string;
}

const LabourModal: React.FC<LabourModalProps> = ({ isOpen, onClose, onSave, labour, siteId }) => {
  const [formData, setFormData] = useState({
    labour_code: '',
    full_name: '',
    mobile_number: '',
    skill_type: 'Helper',
    daily_wage: '500.00',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (labour) {
      setFormData({
        labour_code: labour.labour_code,
        full_name: labour.full_name,
        mobile_number: labour.mobile_number || '',
        skill_type: labour.skill_type,
        daily_wage: labour.daily_wage,
        status: labour.status
      });
    } else {
      setFormData({
        labour_code: `LAB-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        full_name: '',
        mobile_number: '',
        skill_type: 'Helper',
        daily_wage: '500.00',
        status: 'Active'
      });
    }
    setError('');
  }, [labour, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (labour) {
        await api.patch(`/labour/${labour.id}/`, formData);
      } else {
        await api.post('/labour/', { ...formData, site: siteId });
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Failed to save labour record.';
      if (err.response?.data) {
        if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          const firstKey = Object.keys(err.response.data)[0];
          errorMsg = `${firstKey}: ${err.response.data[firstKey][0] || err.response.data[firstKey]}`;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-surface flex-shrink-0">
          <h3 className="text-headline-md font-bold text-on-surface">
            {labour ? 'Edit Labourer' : 'Add Labourer'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full text-text-muted">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {error && <div className="p-3 bg-error-container text-on-error-container rounded-lg text-label-md">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Labour Code</label>
              <input 
                required 
                type="text" 
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.labour_code}
                onChange={(e) => setFormData({...formData, labour_code: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Mobile Number</label>
              <input 
                type="tel" 
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.mobile_number}
                onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1">Full Name</label>
            <input 
              required 
              type="text" 
              className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Skill Category</label>
              <select 
                required 
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.skill_type}
                onChange={(e) => setFormData({...formData, skill_type: e.target.value})}
              >
                <option value="Mason">Mason</option>
                <option value="Carpenter">Carpenter</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Helper">Helper</option>
                <option value="Painter">Painter</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Daily Wage (₹)</label>
              <input 
                required 
                type="number" 
                step="0.01"
                className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.daily_wage}
                onChange={(e) => setFormData({...formData, daily_wage: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-label-md font-bold text-on-surface mb-2">Status</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="status"
                  className="text-primary focus:ring-primary"
                  checked={formData.status === 'Active'}
                  onChange={() => setFormData({...formData, status: 'Active'})}
                />
                <span className="text-body-md">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="status"
                  className="text-error focus:ring-error"
                  checked={formData.status === 'Inactive'}
                  onChange={() => setFormData({...formData, status: 'Inactive'})}
                />
                <span className="text-body-md">Inactive</span>
              </label>
            </div>
          </div>

          <div className="pt-6 flex gap-3 justify-end flex-shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-border-subtle font-bold text-text-muted hover:bg-surface-container-low transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold shadow-sm hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabourModal;
