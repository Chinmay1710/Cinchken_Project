import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import api from '../api/axios';

const ExpenseManagement = () => {
  const { user } = useAuth();
  const { activeSite } = useSite();
  const [expenses, setExpenses] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountReceived, setAmountReceived] = useState('');
  
  // List type feature for expenses
  const [items, setItems] = useState([{ name: '', price: '' }]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-calculated fields
  const expenseAmount = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const closingBalance = (parseFloat(amountReceived) || 0) - expenseAmount;

  useEffect(() => {
    fetchExpenses();
  }, [activeSite?.id]);

  const fetchExpenses = async () => {
    try {
      const siteParam = activeSite?.id ? `?site=${activeSite.id}` : '';
      const res = await api.get(`/finance/site-expenses/${siteParam}`);
      setExpenses(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSite) {
      alert("Please select a site first.");
      return;
    }
    try {
      const compiledParticulars = items
        .filter(i => i.name)
        .map(i => `${i.name} (₹${i.price || 0})`)
        .join(', ');

      await api.post('/finance/site-expenses/', {
        site: activeSite.id,
        date,
        amount_received: parseFloat(amountReceived) || 0,
        particulars: compiledParticulars || 'No particulars entered',
        expense_amount: expenseAmount,
        closing_balance: closingBalance
      });
      setIsModalOpen(false);
      setAmountReceived('');
      setItems([{ name: '', price: '' }]);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert('Error creating expense record.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-fixed/30 blur-[100px] pointer-events-none"></div>
      
      <div className="relative flex flex-col gap-6 p-container-padding pb-24 overflow-y-auto h-full z-10 custom-scrollbar">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-6 rounded-3xl shadow-sm border border-white/40">
          <div>
            <h1 className="text-display font-display text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-[40px] text-primary p-3 bg-surface-container-high rounded-2xl shadow-inner">account_balance_wallet</span>
              Site Expenses
            </h1>
            <p className="text-body-lg text-text-muted mt-2 ml-1">Track daily site petty cash and expenses.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {['ADMIN', 'MANAGER', 'SITE_ENGINEER'].includes(user?.role || '') && (
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all font-semibold shadow-md">
                <span className="material-symbols-outlined">add</span>
                Log Expense
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 glass-card rounded-3xl overflow-hidden border border-white/40 shadow-sm flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-high/50">
                  <th className="p-5 font-semibold text-text-muted">Date</th>
                  <th className="p-5 font-semibold text-text-muted">Site</th>
                  <th className="p-5 font-semibold text-text-muted text-right">Amount Received</th>
                  <th className="p-5 font-semibold text-text-muted">Particulars</th>
                  <th className="p-5 font-semibold text-text-muted text-right">Expense Amount</th>
                  <th className="p-5 font-semibold text-text-muted text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {expenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-5 text-on-surface font-medium">{exp.date}</td>
                    <td className="p-5 text-on-surface-variant">{exp.site_name}</td>
                    <td className="p-5 text-success font-medium text-right">₹{exp.amount_received}</td>
                    <td className="p-5 text-on-surface-variant">{exp.particulars}</td>
                    <td className="p-5 text-error font-medium text-right">₹{exp.expense_amount}</td>
                    <td className="p-5 text-on-surface font-bold text-right">₹{exp.closing_balance}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-muted flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-[48px] text-outline">receipt_long</span>
                      <p>No expense logs found for this site.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high">
              <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Log Site Expense
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-text-muted">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="expenseForm" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-label-md font-medium text-text-muted ml-1">Date *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label-md font-medium text-text-muted ml-1">Amount Received</label>
                  <input type="number" step="0.01" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl outline-none" placeholder="0.00" />
                </div>
                
                <div className="flex flex-col gap-3">
                  <label className="text-label-md font-medium text-text-muted ml-1">Expense Items *</label>
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={e => {
                          const newItems = [...items];
                          newItems[index].name = e.target.value;
                          setItems(newItems);
                        }} 
                        className="flex-1 px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl outline-none text-body-md" 
                        placeholder="Item name" 
                        required 
                      />
                      <input 
                        type="number" 
                        step="0.01" 
                        value={item.price} 
                        onChange={e => {
                          const newItems = [...items];
                          newItems[index].price = e.target.value;
                          setItems(newItems);
                        }} 
                        className="w-32 px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl outline-none text-body-md" 
                        placeholder="Price" 
                        required 
                      />
                      {items.length > 1 && (
                        <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setItems([...items, { name: '', price: '' }])} className="w-full py-2 border-2 border-dashed border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span> Add Another Item
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/30">
                  <div className="flex flex-col gap-1">
                    <label className="text-label-md font-medium text-text-muted ml-1">Total Expense</label>
                    <div className="px-4 py-3.5 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-error font-bold">
                      ₹ {expenseAmount.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-label-md font-medium text-text-muted ml-1">Closing Balance</label>
                    <div className="px-4 py-3.5 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-on-surface font-bold">
                      ₹ {closingBalance.toFixed(2)}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-high">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-text-muted hover:bg-surface-container-highest transition-all">Cancel</button>
              <button type="submit" form="expenseForm" className="px-8 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-md">Save Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;
