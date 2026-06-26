import { useState, useEffect } from 'react';
import api from '../api/axios';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  employee?: any; // If provided, it's edit mode
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave, employee }) => {
  const [formData, setFormData] = useState({
    mobile_number: '',
    password: '',
    full_name: '',
    role: 'SITE_ENGINEER',
    monthly_base_salary: '',
    is_active: true,
    annual_leaves_total: 12,
    sick_leaves_total: 4
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        mobile_number: employee.mobile_number,
        password: '', // Empty on edit
        full_name: employee.full_name,
        role: employee.role,
        monthly_base_salary: employee.monthly_base_salary || '',
        is_active: employee.is_active,
        annual_leaves_total: employee.leave_balance?.annual_leaves_total ?? 12,
        sick_leaves_total: employee.leave_balance?.sick_leaves_total ?? 4
      });
    } else {
      setFormData({
        mobile_number: '',
        password: '',
        full_name: '',
        role: 'SITE_ENGINEER',
        monthly_base_salary: '',
        is_active: true,
        annual_leaves_total: 12,
        sick_leaves_total: 4
      });
    }
    setError('');
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
      try {
        let userId = employee?.id;
        const { annual_leaves_total, sick_leaves_total, ...userData } = formData;
        
        const payload: any = { ...userData };
        if (payload.monthly_base_salary === '') {
          payload.monthly_base_salary = null;
        }

        if (employee) {
          // Edit
          const { password, ...rest } = payload;
          const dataToUpdate: any = { ...rest };
          if (password) dataToUpdate.password = password;
          await api.patch(`/users/${userId}/`, dataToUpdate);
        } else {
          // Create
          const res = await api.post('/users/', payload);
          userId = res.data.id;
        }
      
      // Update Leave Balance
      if (userId) {
        await api.post(`/users/${userId}/update_leave_balance/`, {
          annual_leaves_total,
          sick_leaves_total
        });
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      let errorMsg = 'Failed to save employee.';
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center">
          <h3 className="text-headline-md font-bold text-on-surface">
            {employee ? 'Edit Employee' : 'Add Employee'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full text-text-muted">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-error-container text-on-error-container rounded-lg text-label-md">{error}</div>}
          
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

          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1">Mobile Number</label>
            <input 
              required 
              type="tel" 
              pattern="\d{10}"
              maxLength={10}
              title="Mobile number must be exactly 10 digits"
              className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
              value={formData.mobile_number}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 10) {
                  setFormData({...formData, mobile_number: val});
                }
              }}
            />
          </div>

          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1">
              Password {employee && '(Leave empty to keep unchanged)'}
            </label>
            <input 
              required={!employee}
              type="password" 
              className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1">Role</label>
            <select 
              className="w-full px-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="SITE_ENGINEER">Site Engineer</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Base Salary</label>
              <input 
                type="number"
                value={formData.monthly_base_salary} 
                onChange={(e) => setFormData({...formData, monthly_base_salary: e.target.value})} 
                className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-body-md" 
                placeholder="e.g. 25000" 
              />
            </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Annual Leaves (Yearly)</label>
              <input 
                type="number"
                value={formData.annual_leaves_total} 
                onChange={(e) => setFormData({...formData, annual_leaves_total: parseInt(e.target.value) || 0})} 
                className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-body-md" 
              />
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Sick Leaves (Yearly)</label>
              <input 
                type="number"
                value={formData.sick_leaves_total} 
                onChange={(e) => setFormData({...formData, sick_leaves_total: parseInt(e.target.value) || 0})} 
                className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-body-md" 
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="is_active" 
              className="w-4 h-4 text-primary rounded border-border-subtle focus:ring-primary"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
            />
            <label htmlFor="is_active" className="text-body-md text-on-surface">Active Employee</label>
          </div>

          <div className="pt-6 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-border-subtle font-bold text-text-muted hover:bg-surface-container-low transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold shadow-sm hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
