import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import api from '../api/axios';
import { MaterialModal, InwardModal, ConsumptionModal, RequestModal, HistoryModal } from '../components/InventoryModals';

export interface Material {
  id: string;
  material_code: string;
  material_name: string;
  category: string;
  unit: string;
  minimum_stock: string | number;
}

export interface SiteInventory {
  id: string;
  site: string;
  site_name: string;
  material: string;
  material_details: Material;
  current_quantity: string | number;
  estimated_value: number;
}

export interface MaterialInward {
  id: string;
  site: string;
  site_name: string;
  material: string;
  material_name: string;
  quantity: string | number;
  unit_price: string | number;
  vendor_name: string;
  invoice_number?: string;
  vehicle_number?: string;
  date: string;
}

export interface MaterialConsumption {
  id: string;
  site: string;
  site_name: string;
  material: string;
  material_name: string;
  quantity_used: string | number;
  used_by?: string;
  remarks?: string;
  date: string;
}

export interface MaterialRequest {
  id: string;
  site: string;
  site_name: string;
  material: string;
  material_name: string;
  quantity_required: string | number;
  reason?: string;
  requested_by_name: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Delivered';
  created_at: string;
}

export interface DashboardStats {
  total_materials: number;
  low_stock_count: number;
  total_value: number;
  today_consumption: number;
  low_stock_alerts: {
    material_name: string;
    site_name: string;
    current_quantity: number;
    minimum_stock: number;
  }[];
}

const InventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const { activeSite } = useSite();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isLoading, setIsLoading] = useState(false);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [inventory, setInventory] = useState<SiteInventory[]>([]);
  const [inwards, setInwards] = useState<MaterialInward[]>([]);
  const [consumptions, setConsumptions] = useState<MaterialConsumption[]>([]);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Modals state
  const [isMaterialModalOpen, setMaterialModalOpen] = useState(false);
  const [isInwardModalOpen, setInwardModalOpen] = useState(false);
  const [isConsumptionModalOpen, setConsumptionModalOpen] = useState(false);
  const [isRequestModalOpen, setRequestModalOpen] = useState(false);
  
  // History Modal State
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [historyMaterialId, setHistoryMaterialId] = useState<string>('');
  const [historySiteId, setHistorySiteId] = useState<string>('');

  const tabs = [
    { id: 'Dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'Master', label: 'Material Master', icon: 'category', roles: ['ADMIN'] },
    { id: 'Stock', label: 'Site Stock', icon: 'inventory_2' },
    { id: 'Inward', label: 'Material Inward', icon: 'login', roles: ['ADMIN', 'SITE_ENGINEER'] },
    { id: 'Consumption', label: 'Consumption', icon: 'logout', roles: ['ADMIN', 'SITE_ENGINEER'] },
    { id: 'Requests', label: 'Requests', icon: 'assignment' },
    { id: 'Reports', label: 'Reports', icon: 'assessment' },
  ];

  const visibleTabs = tabs.filter(t => !t.roles || t.roles.includes(user?.role || ''));

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, activeSite?.id]);

  const fetchMaterials = async () => {
    try {
      const res = await api.get('/inventory/materials/');
      setMaterials(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const ts = `t=${Date.now()}`;
    const siteParam = activeSite?.id ? `?site=${activeSite.id}&${ts}` : `?${ts}`;
    try {
      if (activeTab === 'Dashboard') {
        const res = await api.get(`/inventory/dashboard/${siteParam}`);
        setStats(res.data);
      } else if (activeTab === 'Stock') {
        const res = await api.get(`/inventory/site-inventory/${siteParam}`);
        setInventory(res.data.results || res.data);
      } else if (activeTab === 'Inward') {
        const res = await api.get(`/inventory/inwards/${siteParam}`);
        setInwards(res.data.results || res.data);
      } else if (activeTab === 'Consumption') {
        const res = await api.get(`/inventory/consumptions/${siteParam}`);
        setConsumptions(res.data.results || res.data);
      } else if (activeTab === 'Requests') {
        const res = await api.get(`/inventory/requests/${siteParam}`);
        setRequests(res.data.results || res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Decorative Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-fixed/30 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary-fixed/30 blur-[100px] pointer-events-none"></div>

      <div className="relative flex flex-col gap-6 p-container-padding pb-24 overflow-y-auto h-full z-10 custom-scrollbar">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-6 rounded-3xl shadow-sm border border-white/40">
          <div>
            <h1 className="text-display font-display text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-[40px] text-primary p-3 bg-surface-container-high rounded-2xl shadow-inner">inventory_2</span>
              Material Management
            </h1>
            <p className="text-body-lg text-text-muted mt-2 ml-1">Monitor, manage, and optimize your site materials in real-time.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Site selector removed - using global SiteContext instead */}
            
            {activeTab === 'Master' && user?.role === 'ADMIN' && (
              <button onClick={() => setMaterialModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all font-semibold shadow-md hover:shadow-lg">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Add Material
              </button>
            )}
            {activeTab === 'Inward' && ['ADMIN', 'SITE_ENGINEER'].includes(user?.role || '') && (
              <button onClick={() => setInwardModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all font-semibold shadow-md hover:shadow-lg">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Add Inward
              </button>
            )}
            {activeTab === 'Consumption' && ['ADMIN', 'SITE_ENGINEER'].includes(user?.role || '') && (
              <button onClick={() => setConsumptionModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-error text-white rounded-2xl hover:scale-105 active:scale-95 transition-all font-semibold shadow-md hover:shadow-lg">
                <span className="material-symbols-outlined text-[20px]">remove</span>
                Consume
              </button>
            )}
            {activeTab === 'Requests' && (
              <button onClick={() => setRequestModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-secondary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all font-semibold shadow-md hover:shadow-lg">
                <span className="material-symbols-outlined text-[20px]">post_add</span>
                New Request
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Floating Pills) */}
        <div className="w-full mt-4 mb-8">
          <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-4 pt-2 px-2">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center shrink-0 gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition-all whitespace-nowrap border ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105 z-10' 
                    : 'bg-surface border-border-subtle text-text-muted hover:text-text-main hover:bg-surface-container hover:border-text-muted/50'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'text-white' : ''}`}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-[500px] animate-fade-in">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"></div>
              <p className="text-text-muted font-medium animate-pulse">Loading data...</p>
            </div>
          ) : (
            <div className="transition-opacity duration-300">
              {activeTab === 'Dashboard' && <DashboardTab stats={stats} />}
              {activeTab === 'Master' && <MasterTab materials={materials} />}
              {activeTab === 'Stock' && <StockTab inventory={inventory} onOpenHistory={(siteId, materialId) => {
                setHistorySiteId(siteId);
                setHistoryMaterialId(materialId);
                setHistoryModalOpen(true);
              }} />}
              {activeTab === 'Inward' && <InwardTab inwards={inwards} />}
              {activeTab === 'Consumption' && <ConsumptionTab consumptions={consumptions} />}
              {activeTab === 'Requests' && <RequestsTab requests={requests} userRole={user?.role || ''} onUpdate={fetchData} />}
              {activeTab === 'Reports' && <ReportsTab inventory={inventory} inwards={inwards} consumptions={consumptions} />}
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <MaterialModal isOpen={isMaterialModalOpen} onClose={() => setMaterialModalOpen(false)} onSave={fetchMaterials} sites={activeSite ? [activeSite] : []} />
      <InwardModal isOpen={isInwardModalOpen} onClose={() => setInwardModalOpen(false)} onSave={fetchData} sites={activeSite ? [activeSite] : []} materials={materials.length > 0 ? materials : []} />
      <ConsumptionModal isOpen={isConsumptionModalOpen} onClose={() => setConsumptionModalOpen(false)} onSave={fetchData} sites={activeSite ? [activeSite] : []} materials={materials} />
      <RequestModal isOpen={isRequestModalOpen} onClose={() => setRequestModalOpen(false)} onSave={fetchData} sites={activeSite ? [activeSite] : []} materials={materials} />
      {isHistoryModalOpen && (
        <HistoryModal 
          isOpen={isHistoryModalOpen} 
          onClose={() => setHistoryModalOpen(false)} 
          siteId={historySiteId} 
          materialId={historyMaterialId} 
        />
      )}
    </div>
  );
};

// --- Sub-components for Tabs ---

const DashboardTab = ({ stats }: { stats: DashboardStats | null }) => {
  if (!stats) return null;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="group bg-gradient-to-br from-primary-fixed to-primary-fixed-dim rounded-3xl p-6 border border-white/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-default">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="material-symbols-outlined text-primary bg-white/50 backdrop-blur-sm p-3 rounded-2xl shadow-sm text-[28px]">category</span>
          </div>
          <div className="relative z-10">
            <p className="text-label-md text-on-surface/70 font-bold uppercase tracking-wider mb-1">Total Materials</p>
            <p className="text-display font-bold text-on-surface">{stats.total_materials}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="group bg-gradient-to-br from-error-container to-[#ffb4ab] rounded-3xl p-6 border border-white/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-default">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="material-symbols-outlined text-error bg-white/50 backdrop-blur-sm p-3 rounded-2xl shadow-sm text-[28px]">warning</span>
          </div>
          <div className="relative z-10">
            <p className="text-label-md text-on-surface/70 font-bold uppercase tracking-wider mb-1">Low Stock Items</p>
            <p className="text-display font-bold text-error">{stats.low_stock_count}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="group bg-gradient-to-br from-tertiary-fixed to-tertiary-fixed-dim rounded-3xl p-6 border border-white/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-default">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="material-symbols-outlined text-tertiary bg-white/50 backdrop-blur-sm p-3 rounded-2xl shadow-sm text-[28px]">account_balance_wallet</span>
          </div>
          <div className="relative z-10">
            <p className="text-label-md text-on-surface/70 font-bold uppercase tracking-wider mb-1">Material Value</p>
            <p className="text-[32px] leading-[40px] font-bold text-on-surface tracking-tight">₹{stats.total_value.toLocaleString()}</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="group bg-gradient-to-br from-secondary-fixed to-secondary-fixed-dim rounded-3xl p-6 border border-white/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-default">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="material-symbols-outlined text-secondary bg-white/50 backdrop-blur-sm p-3 rounded-2xl shadow-sm text-[28px]">trending_down</span>
          </div>
          <div className="relative z-10">
            <p className="text-label-md text-on-surface/70 font-bold uppercase tracking-wider mb-1">Today's Consumption</p>
            <p className="text-display font-bold text-on-surface">{stats.today_consumption}</p>
          </div>
        </div>
      </div>

      {stats.low_stock_alerts && stats.low_stock_alerts.length > 0 && (
        <div className="glass-card border border-error/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-error"></div>
          <h3 className="text-headline-md font-bold text-error flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined bg-error-container p-2 rounded-xl">notifications_active</span>
            Attention Required: Low Stock
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stats.low_stock_alerts.map((alert, idx) => (
              <div key={idx} className="bg-surface/80 p-5 rounded-2xl border border-error/20 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-on-surface text-lg">{alert.material_name}</span>
                  <span className="material-symbols-outlined text-error/50">arrow_downward</span>
                </div>
                <span className="text-sm font-medium text-text-muted bg-surface-container-high w-fit px-2 py-0.5 rounded-md">{alert.site_name}</span>
                <div className="flex justify-between items-end mt-3 pt-3 border-t border-border-subtle/50">
                  <div className="flex flex-col">
                    <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Current</span>
                    <span className="text-error font-bold text-xl leading-none mt-1">{alert.current_quantity}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Minimum</span>
                    <span className="text-text-main font-bold text-lg leading-none mt-1">{alert.minimum_stock}</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-error h-1.5 rounded-full" style={{ width: `${Math.min(100, (alert.current_quantity / alert.minimum_stock) * 100)}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MasterTab = ({ materials }: { materials: Material[] }) => (
  <div className="glass-card rounded-3xl border border-border-subtle shadow-sm overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead className="bg-surface-container-low/80 backdrop-blur-md border-b border-border-subtle">
        <tr>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Material Code</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Name</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Category</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Unit</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Min Stock</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border-subtle">
        {materials.length === 0 ? (
          <tr><td colSpan={5} className="py-12 text-center text-text-muted font-medium">No materials found.</td></tr>
        ) : materials.map((m) => (
          <tr key={m.id} className="hover:bg-surface-container-lowest transition-colors">
            <td className="py-4 px-6 font-bold text-text-muted"><span className="bg-surface-container-high px-2 py-1 rounded-md text-xs">{m.material_code}</span></td>
            <td className="py-4 px-6 font-bold text-on-surface text-base">{m.material_name}</td>
            <td className="py-4 px-6 font-medium text-text-muted">{m.category}</td>
            <td className="py-4 px-6 font-medium text-text-muted">{m.unit}</td>
            <td className="py-4 px-6 font-bold text-text-main">{m.minimum_stock}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StockTab = ({ inventory, onOpenHistory }: { inventory: SiteInventory[], onOpenHistory: (siteId: string, materialId: string) => void }) => (
  <div className="glass-card rounded-3xl border border-border-subtle shadow-sm overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead className="bg-surface-container-low/80 backdrop-blur-md border-b border-border-subtle">
        <tr>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Site</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Material</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Current Qty</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Est. Value</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Status</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border-subtle">
        {inventory.length === 0 ? (
          <tr><td colSpan={6} className="py-12 text-center text-text-muted font-medium">No stock data found.</td></tr>
        ) : inventory.map((inv) => {
          const isLow = Number(inv.current_quantity) < Number(inv.material_details.minimum_stock);
          return (
            <tr key={inv.id} className="hover:bg-surface-container-lowest transition-colors">
              <td className="py-4 px-6 font-semibold text-text-main">{inv.site_name}</td>
              <td className="py-4 px-6 font-bold text-on-surface">{inv.material_details.material_name}</td>
              <td className="py-4 px-6 font-bold text-on-surface text-lg">
                {inv.current_quantity} <span className="text-xs font-semibold text-text-muted uppercase">{inv.material_details.unit}</span>
              </td>
              <td className="py-4 px-6 font-semibold text-text-muted">₹{inv.estimated_value.toLocaleString()}</td>
              <td className="py-4 px-6">
                {isLow ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-container border border-error/20 text-error text-[12px] font-bold uppercase tracking-wide shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                    Low Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-container border border-success/20 text-success text-[12px] font-bold uppercase tracking-wide shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    Healthy
                  </span>
                )}
              </td>
              <td className="py-4 px-6 text-right">
                <button 
                  onClick={() => onOpenHistory(inv.site, inv.material)} 
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-bold text-text-main rounded-xl bg-surface-container-high hover:bg-surface-container-highest hover:shadow-sm hover:scale-105 active:scale-95 transition-all border border-border-subtle"
                >
                  <span className="material-symbols-outlined text-[18px]">history</span>
                  History
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const InwardTab = ({ inwards }: { inwards: MaterialInward[] }) => (
  <div className="glass-card rounded-3xl border border-border-subtle shadow-sm overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead className="bg-surface-container-low/80 backdrop-blur-md border-b border-border-subtle">
        <tr>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Date</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Site</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Material</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Quantity</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Vendor</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Invoice</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border-subtle">
        {inwards.length === 0 ? (
          <tr><td colSpan={6} className="py-12 text-center text-text-muted font-medium">No inward entries found.</td></tr>
        ) : inwards.map((inv) => (
          <tr key={inv.id} className="hover:bg-surface-container-lowest transition-colors">
            <td className="py-4 px-6 font-medium text-text-muted">{new Date(inv.date).toLocaleDateString()}</td>
            <td className="py-4 px-6 font-semibold text-text-main">{inv.site_name}</td>
            <td className="py-4 px-6 font-bold text-on-surface">{inv.material_name}</td>
            <td className="py-4 px-6 font-bold text-success text-lg bg-success-container/30">+{inv.quantity}</td>
            <td className="py-4 px-6 font-medium text-text-muted">{inv.vendor_name}</td>
            <td className="py-4 px-6 font-medium text-text-muted"><span className="bg-surface-container-high px-2 py-1 rounded-md text-xs">{inv.invoice_number || '-'}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ConsumptionTab = ({ consumptions }: { consumptions: MaterialConsumption[] }) => (
  <div className="glass-card rounded-3xl border border-border-subtle shadow-sm overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead className="bg-surface-container-low/80 backdrop-blur-md border-b border-border-subtle">
        <tr>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Date</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Site</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Material</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Quantity</th>
          <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Used By</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border-subtle">
        {consumptions.length === 0 ? (
          <tr><td colSpan={5} className="py-12 text-center text-text-muted font-medium">No consumption entries found.</td></tr>
        ) : consumptions.map((con) => (
          <tr key={con.id} className="hover:bg-surface-container-lowest transition-colors">
            <td className="py-4 px-6 font-medium text-text-muted">{new Date(con.date).toLocaleDateString()}</td>
            <td className="py-4 px-6 font-semibold text-text-main">{con.site_name}</td>
            <td className="py-4 px-6 font-bold text-on-surface">{con.material_name}</td>
            <td className="py-4 px-6 font-bold text-error text-lg bg-error-container/30">-{con.quantity_used}</td>
            <td className="py-4 px-6 font-medium text-text-muted">{con.used_by || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const RequestsTab = ({ requests, userRole, onUpdate }: { requests: MaterialRequest[], userRole: string, onUpdate: () => void }) => {
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/inventory/requests/${id}/update_status/`, { status });
      onUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Only Admins and Managers can approve requests.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-success-container text-success border-success/20';
      case 'Rejected': return 'bg-error-container text-error border-error/20';
      case 'Delivered': return 'bg-primary-container text-primary border-primary/20';
      default: return 'bg-surface-container-high text-text-muted border-border-subtle';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return 'check_circle';
      case 'Rejected': return 'cancel';
      case 'Delivered': return 'local_shipping';
      default: return 'pending';
    }
  }

  return (
    <div className="glass-card rounded-3xl border border-border-subtle shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-container-low/80 backdrop-blur-md border-b border-border-subtle">
          <tr>
            <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Date</th>
            <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Site</th>
            <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Material</th>
            <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Qty Req</th>
            <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">By</th>
            <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider">Status</th>
            {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
              <th className="py-4 px-6 text-label-md font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {requests.length === 0 ? (
            <tr><td colSpan={7} className="py-12 text-center text-text-muted font-medium">No requests found.</td></tr>
          ) : requests.map((req) => (
            <tr key={req.id} className="hover:bg-surface-container-lowest transition-colors">
              <td className="py-4 px-6 font-medium text-text-muted">{new Date(req.created_at).toLocaleDateString()}</td>
              <td className="py-4 px-6 font-semibold text-text-main">{req.site_name}</td>
              <td className="py-4 px-6 font-bold text-on-surface">{req.material_name}</td>
              <td className="py-4 px-6 font-bold text-lg">{req.quantity_required}</td>
              <td className="py-4 px-6 font-medium text-text-muted">{req.requested_by_name}</td>
              <td className="py-4 px-6">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wide border shadow-sm ${getStatusColor(req.status)}`}>
                  <span className="material-symbols-outlined text-[16px]">{getStatusIcon(req.status)}</span>
                  {req.status}
                </span>
              </td>
              {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                <td className="py-4 px-6 text-right">
                  {req.status === 'Pending' && (
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleUpdateStatus(req.id, 'Approved')} className="p-2 rounded-xl bg-success-container text-success hover:scale-110 active:scale-95 transition-all shadow-sm" title="Approve">
                        <span className="material-symbols-outlined text-[20px]">check</span>
                      </button>
                      <button onClick={() => handleUpdateStatus(req.id, 'Rejected')} className="p-2 rounded-xl bg-error-container text-error hover:scale-110 active:scale-95 transition-all shadow-sm" title="Reject">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>
                  )}
                  {req.status === 'Approved' && (
                    <button onClick={() => handleUpdateStatus(req.id, 'Delivered')} className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-primary text-white hover:scale-105 active:scale-95 transition-all shadow-md">
                      <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                      Deliver
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ReportsTab = ({ inventory, inwards, consumptions }: { inventory: SiteInventory[], inwards: MaterialInward[], consumptions: MaterialConsumption[] }) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="glass-card rounded-3xl border border-border-subtle p-8 shadow-sm">
        <h3 className="text-display-sm font-bold text-on-surface mb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary bg-primary-container p-2 rounded-xl">assessment</span>
          Material Summary Report
        </h3>
        <p className="text-body-lg text-text-muted mb-8 max-w-2xl">Overview of all active site stock and recent transactions. Use the export options below to share this data with your team.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-surface to-surface-container border border-white/50 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-label-md text-text-muted uppercase tracking-wider block mb-2 font-bold">Total Stock Items</span>
            <span className="text-display font-bold text-on-surface">{inventory.length}</span>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-success-container/30 to-success-container/10 border border-success/10 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-label-md text-success uppercase tracking-wider block mb-2 font-bold">Recent Inwards</span>
            <span className="text-display font-bold text-success">{inwards.length}</span>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-error-container/30 to-error-container/10 border border-error/10 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-label-md text-error uppercase tracking-wider block mb-2 font-bold">Recent Consumptions</span>
            <span className="text-display font-bold text-error">{consumptions.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-border-subtle/50">
          <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-container-high hover:bg-surface-container-highest rounded-2xl font-bold transition-all border border-border-subtle shadow-sm hover:shadow-md hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-[20px] text-success">table_chart</span>
            Export CSV
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-container-high hover:bg-surface-container-highest rounded-2xl font-bold transition-all border border-border-subtle shadow-sm hover:shadow-md hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-[20px] text-error">picture_as_pdf</span>
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;
