import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import api from '../api/axios';
import { EquipmentModal, EquipmentLogModal, DieselLogModal } from '../components/EquipmentModals';

const EquipmentManagement = () => {
  const { user } = useAuth();
  const { activeSite } = useSite();
  const [activeTab, setActiveTab] = useState('Master');
  const [equipments, setEquipments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [dieselLogs, setDieselLogs] = useState([]);
  
  const [isEqModalOpen, setEqModalOpen] = useState(false);
  const [isLogModalOpen, setLogModalOpen] = useState(false);
  const [isDieselModalOpen, setDieselModalOpen] = useState(false);

  useEffect(() => {
    fetchEquipments();
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchDieselLogs();
  }, [activeSite?.id, activeTab]);

  const fetchEquipments = async () => {
    try {
      const res = await api.get('/equipment/list/');
      setEquipments(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const siteParam = activeSite?.id ? `?site=${activeSite.id}` : '';
      const res = await api.get(`/equipment/logs/${siteParam}`);
      setLogs(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDieselLogs = async () => {
    try {
      const siteParam = activeSite?.id ? `?site=${activeSite.id}` : '';
      const res = await api.get(`/equipment/diesel-logs/${siteParam}`);
      setDieselLogs(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'Master', label: 'Active Inventory', icon: 'precision_manufacturing', roles: ['ADMIN'] },
    { id: 'Logs', label: 'Usage Logs', icon: 'history' },
    { id: 'Diesel', label: 'Diesel Logs', icon: 'local_gas_station' },
  ];
  const visibleTabs = tabs.filter(t => !t.roles || t.roles.includes(user?.role || ''));

  // Calculate dummy stats based on loaded data
  const totalFuel = dieselLogs.reduce((acc, l: any) => acc + parseFloat(l.liters_consumed || 0), 0);
  const activeCount = equipments.filter((e:any) => e.is_active).length;
  const operationalRate = equipments.length > 0 ? ((activeCount / equipments.length) * 100).toFixed(1) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface text-on-background relative overflow-y-auto custom-scrollbar p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface">Equipment Fleet</h2>
          <p className="text-body-md text-text-muted">Real-time monitoring of active industrial assets and usage.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setDieselModalOpen(true)} className="px-4 py-2 border border-border-subtle rounded-xl text-label-md font-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[18px]">local_gas_station</span> Log Diesel
          </button>
          <button onClick={() => setLogModalOpen(true)} className="px-4 py-2 border border-border-subtle rounded-xl text-label-md font-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[18px]">more_time</span> Log Usage
          </button>
          {user?.role === 'ADMIN' && (
            <button onClick={() => setEqModalOpen(true)} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-label-md font-label-md flex items-center gap-2 hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">add_circle</span> Register Asset
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-status-active/10 text-status-active rounded-lg material-symbols-outlined">check_circle</span>
            <span className="text-label-sm text-status-active font-bold">Good</span>
          </div>
          <div className="mt-4">
            <p className="text-label-sm text-text-muted uppercase tracking-wider">Operational Rate</p>
            <p className="text-headline-md font-bold">{operationalRate}%</p>
          </div>
        </div>
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-status-on-hold/10 text-status-on-hold rounded-lg material-symbols-outlined">warning</span>
          </div>
          <div className="mt-4">
            <p className="text-label-sm text-text-muted uppercase tracking-wider">Assets Deployed</p>
            <p className="text-headline-md font-bold">{activeCount} Assets</p>
          </div>
        </div>
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-status-completed/10 text-status-completed rounded-lg material-symbols-outlined">local_gas_station</span>
          </div>
          <div className="mt-4">
            <p className="text-label-sm text-text-muted uppercase tracking-wider">Fuel Consumption</p>
            <p className="text-headline-md font-bold">{totalFuel} L</p>
          </div>
        </div>
        <div className="p-6 bg-primary-container text-on-primary-container rounded-xl border border-primary-container shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <span className="p-2 bg-white/10 text-white rounded-lg material-symbols-outlined">history</span>
          </div>
          <div className="mt-4 relative z-10">
            <p className="text-label-sm text-white/60 uppercase tracking-wider">Usage Logs</p>
            <p className="text-headline-md font-bold text-white">{logs.length} Entries</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-[120px]">architecture</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Table and Side Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table Area */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border-subtle flex flex-wrap gap-2 items-center bg-surface/50">
            {visibleTabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${activeTab === tab.id ? 'bg-surface-container-high text-primary shadow-sm border border-border-subtle' : 'text-text-muted hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto flex-1 custom-scrollbar">
            {activeTab === 'Master' && (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="text-label-sm text-text-muted uppercase tracking-wider bg-surface/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Asset / ID</th>
                    <th className="px-6 py-4 font-semibold">Supplier</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {equipments.map((eq: any) => (
                    <tr key={eq.id} className="hover:bg-surface transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-surface-container-low rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">precision_manufacturing</span>
                          </div>
                          <div>
                            <p className="text-body-md font-bold text-on-surface">{eq.name}</p>
                            <p className="text-label-sm text-text-muted">EQ-{eq.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-body-md">{eq.supplier_name || '-'}</td>
                      <td className="px-6 py-4 text-body-md">{eq.description || '-'}</td>
                      <td className="px-6 py-4">
                        {eq.is_active ? 
                          <span className="px-2 py-1 bg-status-active/10 text-status-active text-label-sm rounded-full font-bold">Active</span> : 
                          <span className="px-2 py-1 bg-error/10 text-error text-label-sm rounded-full font-bold">Offline</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {equipments.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-text-muted">No equipment found.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'Logs' && (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="text-label-sm text-text-muted uppercase tracking-wider bg-surface/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Equipment</th>
                    <th className="px-6 py-4 font-semibold">Time</th>
                    <th className="px-6 py-4 font-semibold">Total Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4 text-body-md font-bold">{log.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-text-muted">construction</span>
                          <span className="text-body-md">{log.equipment_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-body-md text-text-muted">
                        {log.start_time && log.end_time ? `${log.start_time.substring(0,5)} - ${log.end_time.substring(0,5)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-body-md font-bold text-primary">{log.total_hours} hrs</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-text-muted">No logs found.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'Diesel' && (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="text-label-sm text-text-muted uppercase tracking-wider bg-surface/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Equipment</th>
                    <th className="px-6 py-4 font-semibold">Liters Consumed</th>
                    <th className="px-6 py-4 font-semibold">Slip / Issued By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {dieselLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4 text-body-md font-bold">{log.date}</td>
                      <td className="px-6 py-4 text-body-md">{log.equipment_name}</td>
                      <td className="px-6 py-4 text-body-md font-bold text-error">{log.liters_consumed} L</td>
                      <td className="px-6 py-4 text-label-sm text-text-muted">
                        Slip: {log.slip_number || '-'}<br/>By: {log.issued_by || '-'}
                      </td>
                    </tr>
                  ))}
                  {dieselLogs.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-text-muted">No diesel logs found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Side Details */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm p-6">
            <h3 className="text-title-lg font-title-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">history</span>
              Recent Usage Logs
            </h3>
            <div className="space-y-4">
              {logs.slice(0, 3).map((log: any) => (
                <div key={log.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-status-completed mt-2"></div>
                    <div className="w-0.5 flex-1 bg-border-subtle my-1"></div>
                  </div>
                  <div className="pb-2">
                    <p className="text-label-sm font-bold text-on-surface">{log.equipment_name}</p>
                    <p className="text-body-md text-text-muted">{log.total_hours} hrs • {log.date}</p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <p className="text-sm text-text-muted">No recent logs.</p>}
            </div>
            <button onClick={() => setActiveTab('Logs')} className="w-full mt-4 py-2 text-label-md text-secondary font-bold hover:bg-secondary/5 rounded-lg transition-colors">View All Logs</button>
          </div>

          {/* Map Preview */}
          <div className="relative h-64 rounded-xl overflow-hidden border border-border-subtle group hidden md:block">
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Satellite View of Construction Site" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_2k7Lmc66UDa3g_TayYbavEXjZMHTsP0AFDOlS-BStgBhYSpZqLtpEPR5dwIddKHTC4GhvDu_xL2ZmbVD6-NVXJJCdy-qGFoNHkf0otxTooEHLMynXjNSzFtky24cZZ8moK6tE0sxArAsV6vQxyoaNllXje6EhMf7OLSK-0s6R7L4AUcjrliNJ2m0k68q2uqPIy8XHf3JoQ5NMc4T1XJsm3RSYS3AUart_d6yDTaG2xz64ryjD8ov8PkHuEQlD3LXBOVbpCtz7g" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div>
                <h4 className="text-body-md font-bold text-white mb-1">{activeSite ? activeSite.name : 'All Sites'}</h4>
                <p className="text-label-sm text-white/80">Asset tracking active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EquipmentModal isOpen={isEqModalOpen} onClose={() => setEqModalOpen(false)} onSuccess={fetchEquipments} />
      <EquipmentLogModal isOpen={isLogModalOpen} onClose={() => setLogModalOpen(false)} onSuccess={fetchLogs} equipments={equipments} />
      <DieselLogModal isOpen={isDieselModalOpen} onClose={() => setDieselModalOpen(false)} onSuccess={fetchDieselLogs} equipments={equipments} />
    </div>
  );
};

export default EquipmentManagement;
