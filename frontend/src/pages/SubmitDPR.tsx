import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const SubmitDPR = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // The huge payload state
  const [workSummary, setWorkSummary] = useState('');
  const [progressPercentage, setProgressPercentage] = useState('0');
  
  const [workReports, setWorkReports] = useState([{ nature_of_work: '', nos: '', length: '', width: '', height: '', quantity: '' }]);
  const [manpower, setManpower] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [planning, setPlanning] = useState([{ plan_activity: '', requirements: '' }]);

  useEffect(() => {
    fetchPrefillData();
  }, [siteId, date]);

  const fetchPrefillData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/daily/prefill/?site=${siteId}&date=${date}`);
      setManpower(res.data.manpower_details || []);
      setMaterials(res.data.material_details || []);
      setEquipments(res.data.equipment_details || []);
      setExpenses(res.data.expense_details || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkReportChange = (index: number, field: string, value: string) => {
    const newReports = [...workReports];
    newReports[index] = { ...newReports[index], [field]: value };
    setWorkReports(newReports);
  };

  const handlePlanningChange = (index: number, field: string, value: string) => {
    const newPlanning = [...planning];
    newPlanning[index] = { ...newPlanning[index], [field]: value };
    setPlanning(newPlanning);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Clean up empty rows
    const cleanedWorkReports = workReports.filter(w => w.nature_of_work && w.quantity);
    const cleanedPlanning = planning.filter(p => p.plan_activity);

    const payload = {
      site: siteId,
      report_date: date,
      work_summary: workSummary || "Detailed Report Generated",
      progress_percentage: parseInt(progressPercentage) || 0,
      sync_id: crypto.randomUUID(),
      work_reports: cleanedWorkReports.map(w => ({
        ...w,
        nos: w.nos ? parseInt(w.nos) : null,
        length: w.length ? parseFloat(w.length) : null,
        width: w.width ? parseFloat(w.width) : null,
        height: w.height ? parseFloat(w.height) : null,
        quantity: parseFloat(w.quantity)
      })),
      manpower_details: manpower,
      material_details: materials,
      equipment_details: equipments,
      expense_details: expenses,
      planning_details: cleanedPlanning
    };

    try {
      await api.post('/reports/daily/', payload);
      alert('Detailed Progress Report submitted successfully!');
      navigate(`/sites/${siteId}`);
    } catch (err: any) {
      console.error(err.response?.data || err);
      alert('Failed to submit report. Please check the inputs.\n' + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Loading Prefill Data...</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-surface-bright p-container-padding custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/sites/${siteId}`} className="p-2 bg-surface-container-low hover:bg-surface-container rounded-full transition-colors text-text-main">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h2 className="text-[32px] font-bold text-text-main font-display">Submit Daily Progress Report</h2>
            <p className="text-body-md text-text-muted">Data has been automatically pre-filled for {date}.</p>
          </div>
          <div className="ml-auto">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white border border-border-subtle rounded-xl px-4 py-2 font-medium" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section A: Work Report */}
          <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm">
            <h3 className="text-title-lg font-bold text-primary mb-4 border-b pb-2">A. WORK REPORT</h3>
            <div className="space-y-4">
              {workReports.map((wr, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <span className="text-label-md font-bold text-text-muted w-6">{idx + 1}.</span>
                  <input type="text" placeholder="Nature of Work" value={wr.nature_of_work} onChange={e => handleWorkReportChange(idx, 'nature_of_work', e.target.value)} className="flex-[3] px-3 py-2 border rounded-lg" required />
                  <input type="number" placeholder="Nos" value={wr.nos} onChange={e => handleWorkReportChange(idx, 'nos', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                  <input type="number" step="0.01" placeholder="Length" value={wr.length} onChange={e => handleWorkReportChange(idx, 'length', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                  <input type="number" step="0.01" placeholder="Width" value={wr.width} onChange={e => handleWorkReportChange(idx, 'width', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                  <input type="number" step="0.01" placeholder="Height" value={wr.height} onChange={e => handleWorkReportChange(idx, 'height', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                  <input type="number" step="0.01" placeholder="Total Qty" value={wr.quantity} onChange={e => handleWorkReportChange(idx, 'quantity', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg font-bold" required />
                </div>
              ))}
              <button type="button" onClick={() => setWorkReports([...workReports, { nature_of_work: '', nos: '', length: '', width: '', height: '', quantity: '' }])} className="text-primary font-bold text-sm flex items-center gap-1 hover:bg-primary/10 px-3 py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-[18px]">add</span> Add Row
              </button>
            </div>
          </div>

          {/* Section B: Manpower (Pre-filled) */}
          <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm opacity-90">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-title-lg font-bold text-error">B. MANPOWER DETAILS</h3>
              <span className="text-xs font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full">Auto-Filled from Attendance</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {manpower.length === 0 ? <p className="text-text-muted">No attendance logged today.</p> : manpower.map((m: any, idx) => (
                <div key={idx} className="flex justify-between p-3 bg-surface-container-lowest border rounded-xl">
                  <span className="font-medium">{idx + 1}. {m.name_of_labour}</span>
                  <span className="text-text-muted">{m.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section C: Materials (Pre-filled) */}
          <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm opacity-90">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-title-lg font-bold text-error">C. MATERIAL DETAILS (Consumable)</h3>
              <span className="text-xs font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full">Auto-Filled from Inventory</span>
            </div>
            <div className="space-y-3">
              {materials.length === 0 ? <p className="text-text-muted">No material inwards or consumptions today.</p> : materials.map((m: any, idx) => (
                <div key={idx} className="flex justify-between p-3 bg-surface-container-lowest border rounded-xl items-center">
                  <span className="font-medium flex-[2]">{idx + 1}. {m.description}</span>
                  <span className="flex-1 text-text-muted">{m.supplier_name}</span>
                  <span className="flex-1 text-text-muted">{m.challan_no}</span>
                  <span className="flex-1 text-right font-bold">{m.quantity} {m.unit}</span>
                  <span className="flex-1 text-right text-error font-medium">₹{m.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section D: Equipments (Pre-filled) */}
          <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm opacity-90">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-title-lg font-bold text-error">D. EQUIPMENTS / MACHINERY</h3>
              <span className="text-xs font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full">Auto-Filled from Equipment Logs</span>
            </div>
            <div className="space-y-3">
              {equipments.length === 0 ? <p className="text-text-muted">No equipment logs today.</p> : equipments.map((e: any, idx) => (
                <div key={idx} className="flex justify-between p-3 bg-surface-container-lowest border rounded-xl items-center">
                  <span className="font-medium flex-[2]">{idx + 1}. {e.machine_supplier_name}</span>
                  <span className="flex-1 text-center">{e.start_time} - {e.end_time}</span>
                  <span className="flex-1 text-center font-bold text-primary">{e.total_hours} hrs</span>
                  <span className="flex-[2] text-text-muted text-right">{e.remarks}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section E: Expenses (Pre-filled) */}
          <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm opacity-90">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-title-lg font-bold text-error">E. EXPENSES</h3>
              <span className="text-xs font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full">Auto-Filled from Finance</span>
            </div>
            <div className="space-y-3">
              {expenses.length === 0 ? <p className="text-text-muted">No expenses logged today.</p> : expenses.map((e: any, idx) => (
                <div key={idx} className="flex justify-between p-3 bg-surface-container-lowest border rounded-xl items-center">
                  <span className="font-medium flex-1 text-success">₹{e.amount_received}</span>
                  <span className="flex-[2] text-text-muted">{e.particulars}</span>
                  <span className="flex-1 text-error font-medium text-right">₹{e.expense_amount}</span>
                  <span className="flex-1 text-right font-bold">₹{e.closing_balance}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section F: Planning */}
          <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm">
            <h3 className="text-title-lg font-bold text-primary mb-4 border-b pb-2">F. TOMORROWS PLANNING & REQUIREMENTS</h3>
            <div className="space-y-4">
              {planning.map((p, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <span className="text-label-md font-bold text-text-muted w-6">{idx + 1}.</span>
                  <input type="text" placeholder="Tomorrow's Plan Activity" value={p.plan_activity} onChange={e => handlePlanningChange(idx, 'plan_activity', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" required />
                  <input type="text" placeholder="Plan Activity Additional Requirements" value={p.requirements} onChange={e => handlePlanningChange(idx, 'requirements', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                </div>
              ))}
              <button type="button" onClick={() => setPlanning([...planning, { plan_activity: '', requirements: '' }])} className="text-primary font-bold text-sm flex items-center gap-1 hover:bg-primary/10 px-3 py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-[18px]">add</span> Add Row
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pb-12">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 font-semibold rounded-xl text-text-muted hover:bg-surface-container-low transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
              {submitting ? 'Submitting...' : 'Submit Final Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitDPR;
