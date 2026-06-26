import React, { useState, useEffect } from 'react';
import api from '../api/axios';

// Reusable Modal Wrapper with Glassmorphism and Animations
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col glass-card bg-surface/90 rounded-3xl shadow-2xl border border-white/50 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-border-subtle/50 bg-gradient-to-r from-surface-container-lowest/80 to-surface-container-low/80 backdrop-blur-md">
          <h2 className="text-headline-md font-bold text-on-surface tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-surface-container-high hover:rotate-90 text-text-muted hover:text-error transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar relative">
          {children}
        </div>
      </div>
    </div>
  );
};

// Form Input Component for consistency
const FormField = ({ label, children, isOptional = false }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-label-sm font-bold text-text-muted uppercase tracking-wider ml-1">
      {label} {isOptional && <span className="text-text-muted/60 font-normal normal-case ml-1">(Optional)</span>}
    </label>
    {children}
  </div>
);

const inputStyles = "w-full px-5 py-3.5 bg-surface-container-lowest border border-border-subtle hover:border-primary/40 rounded-2xl text-body-md text-text-main font-medium focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm placeholder:text-text-muted/50";
const selectStyles = `${inputStyles} appearance-none cursor-pointer bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,<svg%20width=%2224%22%20height=%2224%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20xmlns=%22http://www.w3.org/2000/svg%22><path%20d=%22M7%2010l5%205%205-5%22%20stroke=%22%2364748B%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/></svg>')] bg-[position:right_16px_center] bg-[length:24px_24px] pr-12`;

export const MaterialModal = ({ isOpen, onClose, onSave, sites }: any) => {
  const [formData, setFormData] = useState({
    material_code: '',
    material_name: '',
    category: '',
    unit: 'Pieces',
    minimum_stock: '0'
  });
  
  // Optional initial stock fields
  const [addInitialStock, setAddInitialStock] = useState(false);
  const [initialStock, setInitialStock] = useState({
    site: '',
    quantity: '',
    unit_price: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/inventory/materials/', formData);
      const newMaterial = res.data;
      
      // If user opted to add initial stock
      if (addInitialStock && initialStock.site && initialStock.quantity && initialStock.unit_price) {
        await api.post('/inventory/inwards/', {
          material: newMaterial.id,
          site: initialStock.site,
          quantity: initialStock.quantity,
          unit_price: initialStock.unit_price,
          vendor_name: 'Initial Stock Assignment',
          date: new Date().toISOString().split('T')[0]
        });
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      alert("Error saving material: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Material">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Material Code">
          <input required type="text" placeholder="e.g. MAT-001" className={inputStyles} value={formData.material_code} onChange={e => setFormData({...formData, material_code: e.target.value})} />
        </FormField>
        <FormField label="Material Name">
          <input required type="text" placeholder="e.g. Portland Cement 50kg" className={inputStyles} value={formData.material_name} onChange={e => setFormData({...formData, material_name: e.target.value})} />
        </FormField>
        <FormField label="Category">
          <input required type="text" placeholder="e.g. Building Materials" className={inputStyles} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
        </FormField>
        <div className="grid grid-cols-2 gap-5">
          <FormField label="Unit">
            <input required type="text" placeholder="e.g. Kg, Bags, Ltr" className={inputStyles} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
          </FormField>
          <FormField label="Min Stock">
            <input required type="number" min="0" step="0.01" className={inputStyles} value={formData.minimum_stock} onChange={e => setFormData({...formData, minimum_stock: e.target.value})} />
          </FormField>
        </div>

        {/* Initial Stock Assignment (Optional) */}
        <div className="mt-2 p-5 rounded-2xl bg-primary-fixed/30 border border-primary/20">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary/20"
              checked={addInitialStock}
              onChange={(e) => setAddInitialStock(e.target.checked)}
            />
            <span className="font-bold text-text-main">Add Initial Stock & Price Assignment</span>
          </label>
          
          {addInitialStock && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <FormField label="Assign to Site">
                <select required className={selectStyles} value={initialStock.site} onChange={e => setInitialStock({...initialStock, site: e.target.value})}>
                  <option value="" disabled>Select Site</option>
                  {sites?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Quantity">
                <input required type="number" min="0.01" step="0.01" placeholder="Qty" className={inputStyles} value={initialStock.quantity} onChange={e => setInitialStock({...initialStock, quantity: e.target.value})} />
              </FormField>
              <FormField label="Unit Price">
                <input required type="number" min="0" step="0.01" placeholder="₹ 0.00" className={inputStyles} value={initialStock.unit_price} onChange={e => setInitialStock({...initialStock, unit_price: e.target.value})} />
              </FormField>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-border-subtle/50">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-text-muted hover:bg-surface-container-high transition-colors">Cancel</button>
          <button type="submit" className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-primary text-white hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-lg">
            <span className="material-symbols-outlined text-[20px]">save</span>
            Save Material
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const InwardModal = ({ isOpen, onClose, onSave, sites, materials }: any) => {
  const [formData, setFormData] = useState({
    site: '',
    material: '',
    quantity: '',
    unit_price: '',
    vendor_name: '',
    invoice_number: '',
    vehicle_number: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/inwards/', formData);
      onSave();
      onClose();
    } catch (err: any) {
      alert("Error adding inward: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Material Inward">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Site">
            <select required className={selectStyles} value={formData.site} onChange={e => setFormData({...formData, site: e.target.value})}>
              <option value="">Select Destination Site</option>
              {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Material">
            <select required className={selectStyles} value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})}>
              <option value="">Select Material Item</option>
              {materials.map((m: any) => <option key={m.id} value={m.id}>{m.material_name}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FormField label="Quantity Received">
            <input required type="number" min="0.01" step="0.01" placeholder="0.00" className={inputStyles} value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
          </FormField>
          <FormField label="Unit Price (₹)">
            <input required type="number" min="0" step="0.01" placeholder="0.00" className={inputStyles} value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: e.target.value})} />
          </FormField>
        </div>
        <FormField label="Vendor Name">
          <input required type="text" placeholder="Name of supplier/vendor" className={inputStyles} value={formData.vendor_name} onChange={e => setFormData({...formData, vendor_name: e.target.value})} />
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Invoice Number" isOptional>
            <input type="text" placeholder="e.g. INV-2023-001" className={inputStyles} value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} />
          </FormField>
          <FormField label="Vehicle Number" isOptional>
            <input type="text" placeholder="e.g. MH-12-AB-1234" className={inputStyles} value={formData.vehicle_number} onChange={e => setFormData({...formData, vehicle_number: e.target.value})} />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border-subtle/50">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-text-muted hover:bg-surface-container-high transition-colors">Cancel</button>
          <button type="submit" className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-primary text-white hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-lg">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Add Stock
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const ConsumptionModal = ({ isOpen, onClose, onSave, sites, materials }: any) => {
  const [formData, setFormData] = useState({
    site: '',
    material: '',
    quantity_used: '',
    used_by: '',
    remarks: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/consumptions/', formData);
      onSave();
      onClose();
    } catch (err: any) {
      alert("Error logging consumption: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Consumption">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Site">
            <select required className={selectStyles} value={formData.site} onChange={e => setFormData({...formData, site: e.target.value})}>
              <option value="">Select Site</option>
              {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Material">
            <select required className={selectStyles} value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})}>
              <option value="">Select Material</option>
              {materials.map((m: any) => <option key={m.id} value={m.id}>{m.material_name}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Quantity Used">
            <input required type="number" min="0.01" step="0.01" placeholder="0.00" className={inputStyles} value={formData.quantity_used} onChange={e => setFormData({...formData, quantity_used: e.target.value})} />
          </FormField>
          <FormField label="Used By" isOptional>
            <input type="text" placeholder="Name of engineer or worker" className={inputStyles} value={formData.used_by} onChange={e => setFormData({...formData, used_by: e.target.value})} />
          </FormField>
        </div>
        <FormField label="Remarks / Purpose" isOptional>
          <textarea placeholder="Where was this material used?" rows={2} className={inputStyles} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
        </FormField>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border-subtle/50">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-text-muted hover:bg-surface-container-high transition-colors">Cancel</button>
          <button type="submit" className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-error text-white hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-error/30">
            <span className="material-symbols-outlined text-[20px]">remove_circle</span>
            Log Consumption
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const RequestModal = ({ isOpen, onClose, onSave, sites, materials }: any) => {
  const [formData, setFormData] = useState({
    site: '',
    material: '',
    quantity_required: '',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/requests/', formData);
      onSave();
      onClose();
    } catch (err: any) {
      alert("Error submitting request: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Material">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Site">
            <select required className={selectStyles} value={formData.site} onChange={e => setFormData({...formData, site: e.target.value})}>
              <option value="">Select Destination Site</option>
              {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Material">
            <select required className={selectStyles} value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})}>
              <option value="">Select Material Needed</option>
              {materials.map((m: any) => <option key={m.id} value={m.id}>{m.material_name}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Quantity Required">
          <input required type="number" min="0.01" step="0.01" placeholder="0.00" className={inputStyles} value={formData.quantity_required} onChange={e => setFormData({...formData, quantity_required: e.target.value})} />
        </FormField>
        <FormField label="Reason for Request" isOptional>
          <textarea placeholder="Why is this material needed?" rows={3} className={inputStyles} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
        </FormField>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border-subtle/50">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-text-muted hover:bg-surface-container-high transition-colors">Cancel</button>
          <button type="submit" className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-secondary text-white hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-secondary/30">
            <span className="material-symbols-outlined text-[20px]">send</span>
            Submit Request
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const HistoryModal = ({ isOpen, onClose, siteId, materialId }: any) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && siteId && materialId) {
      fetchHistory();
    }
  }, [isOpen, siteId, materialId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/inventory/site-inventory/stock_history/?site=${siteId}&material=${materialId}`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Material Stock History">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full"></div>
          <p className="text-text-muted font-medium animate-pulse">Loading transaction history...</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-border-subtle shadow-sm overflow-hidden mt-2">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-border-subtle">
              <tr>
                <th className="py-3 px-5 text-label-md font-bold text-text-muted uppercase tracking-wider">Date</th>
                <th className="py-3 px-5 text-label-md font-bold text-text-muted uppercase tracking-wider">Transaction</th>
                <th className="py-3 px-5 text-label-md font-bold text-text-muted uppercase tracking-wider">Reference</th>
                <th className="py-3 px-5 text-label-md font-bold text-text-muted uppercase tracking-wider text-right">Qty</th>
                <th className="py-3 px-5 text-label-md font-bold text-text-muted uppercase tracking-wider text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {history.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-text-muted font-medium">No history found.</td></tr>
              ) : history.map((item, idx) => (
                <tr key={idx} className="hover:bg-surface transition-colors">
                  <td className="py-3 px-5 text-text-muted font-medium">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${item.transaction_type === 'INWARD' ? 'bg-success-container text-success border-success/20' : 'bg-error-container text-error border-error/20'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {item.transaction_type === 'INWARD' ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                      {item.transaction_type}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-text-main font-medium">{item.reference || '-'}</td>
                  <td className={`py-3 px-5 font-bold text-lg text-right ${item.transaction_type === 'INWARD' ? 'text-success' : 'text-error'}`}>
                    {item.transaction_type === 'INWARD' ? '+' : '-'}{item.quantity}
                  </td>
                  <td className="py-3 px-5 font-bold text-lg text-right text-on-surface bg-surface-container-lowest border-l border-border-subtle/30">{item.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};
