import React from 'react';

export const DPRViewerModal = ({ isOpen, onClose, report }: any) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-highest shrink-0">
          <div>
            <h2 className="text-display font-display text-primary uppercase font-bold text-center w-full block">CINCH KEN INFRASTRUCTURE</h2>
            <h3 className="text-title-lg font-bold text-center mt-1">DAILY PROGRESS REPORT</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors shrink-0 self-start">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="border-2 border-black max-w-[800px] mx-auto text-sm bg-white p-1 print:border-none print:p-0">
            {/* Top Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 font-bold border-b-2 border-black pb-2">
              <div>
                <p>SITE INCHARGE NAME :- <span className="font-normal">{report.submitted_by_name || 'N/A'}</span></p>
                <p>NAME OF SITE :- <span className="font-normal">{report.site_name || 'N/A'}</span></p>
              </div>
              <div className="text-right">
                <p>DATE :- <span className="font-normal">{report.report_date}</span></p>
              </div>
            </div>

            {/* A. WORK REPORT */}
            <div className="mb-6">
              <h4 className="bg-red-600 text-white font-bold text-center p-1 uppercase border-y-2 border-black">A. WORK REPORT :-</h4>
              <table className="w-full border-collapse border border-black text-center">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 w-10" rowSpan={2}>Sr. No.</th>
                    <th className="border border-black p-1" rowSpan={2}>Nature of Work</th>
                    <th className="border border-black p-1" colSpan={5}>Quantity of Work Done</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 w-16">Nos</th>
                    <th className="border border-black p-1 w-20">Length</th>
                    <th className="border border-black p-1 w-20">Width</th>
                    <th className="border border-black p-1 w-20">Height</th>
                    <th className="border border-black p-1 w-24">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {report.work_reports?.map((w: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-black p-1">{idx + 1}</td>
                      <td className="border border-black p-1 text-left">{w.nature_of_work}</td>
                      <td className="border border-black p-1">{w.nos || '-'}</td>
                      <td className="border border-black p-1">{w.length || '-'}</td>
                      <td className="border border-black p-1">{w.width || '-'}</td>
                      <td className="border border-black p-1">{w.height || '-'}</td>
                      <td className="border border-black p-1">{w.quantity}</td>
                    </tr>
                  ))}
                  {(!report.work_reports || report.work_reports.length === 0) && (
                    <tr>
                      <td className="border border-black p-4" colSpan={7}>No work reported.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* B. MANPOWER DETAILS */}
            <div className="mb-6">
              <h4 className="bg-red-600 text-white font-bold text-center p-1 uppercase border-y-2 border-black">B. MANPOWER DETAILS :-</h4>
              <div className="grid grid-cols-2">
                <table className="w-full border-collapse border border-black text-center border-r-0">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-1 w-10">Sr. No.</th>
                      <th className="border border-black p-1">Name of Labour</th>
                      <th className="border border-black p-1 text-[10px] leading-tight w-24">Category (Labour/Helper/Carpenter/Mason)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.manpower_details?.slice(0, Math.ceil((report.manpower_details?.length || 1) / 2)).map((m: any, idx: number) => (
                      <tr key={idx}>
                        <td className="border border-black p-1">{idx + 1}</td>
                        <td className="border border-black p-1 text-left">{m.name_of_labour}</td>
                        <td className="border border-black p-1">{m.category}</td>
                      </tr>
                    ))}
                    {(!report.manpower_details || report.manpower_details.length === 0) && (
                      <tr>
                        <td className="border border-black p-4" colSpan={3}>No manpower reported.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <table className="w-full border-collapse border border-black text-center border-l-0">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-1 w-10 border-l-0">Sr. No.</th>
                      <th className="border border-black p-1">Name of Labour</th>
                      <th className="border border-black p-1">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.manpower_details?.slice(Math.ceil((report.manpower_details?.length || 1) / 2)).map((m: any, idx: number) => {
                      const offset = Math.ceil((report.manpower_details?.length || 1) / 2);
                      return (
                        <tr key={idx}>
                          <td className="border border-black p-1 border-l-0">{offset + idx + 1}</td>
                          <td className="border border-black p-1 text-left">{m.name_of_labour}</td>
                          <td className="border border-black p-1">{m.category}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* C. Material Details */}
            <div className="mb-6">
              <h4 className="bg-red-600 text-white font-bold text-center p-1 uppercase border-y-2 border-black">C. Material Details (Consumable) :-</h4>
              <table className="w-full border-collapse border border-black text-center">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 w-10">Sr. No.</th>
                    <th className="border border-black p-1">Description of Material received</th>
                    <th className="border border-black p-1">Supplier Name</th>
                    <th className="border border-black p-1">Challan No.</th>
                    <th className="border border-black p-1 w-16">Unit</th>
                    <th className="border border-black p-1 w-20">Quantity</th>
                    <th className="border border-black p-1 w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.material_details?.map((m: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-black p-1">{idx + 1}</td>
                      <td className="border border-black p-1 text-left">{m.description}</td>
                      <td className="border border-black p-1">{m.supplier_name || '-'}</td>
                      <td className="border border-black p-1">{m.challan_no || '-'}</td>
                      <td className="border border-black p-1">{m.unit}</td>
                      <td className="border border-black p-1">{m.quantity}</td>
                      <td className="border border-black p-1">{m.amount ? `₹${m.amount}` : '-'}</td>
                    </tr>
                  ))}
                  {(!report.material_details || report.material_details.length === 0) && (
                    <tr>
                      <td className="border border-black p-4" colSpan={7}>No materials reported.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* D. Equipments / Machinery */}
            <div className="mb-6">
              <h4 className="bg-red-600 text-white font-bold text-center p-1 uppercase border-y-2 border-black">D. Equipments/ Machinery :-</h4>
              <table className="w-full border-collapse border border-black text-center">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 w-10" rowSpan={2}>Sr. No.</th>
                    <th className="border border-black p-1" rowSpan={2}>Machine with Supplier Name</th>
                    <th className="border border-black p-1" colSpan={3}>Working & Ideal Hours</th>
                    <th className="border border-black p-1" rowSpan={2}>Reason/ Remarks</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 w-24">Start Time</th>
                    <th className="border border-black p-1 w-24">End Time</th>
                    <th className="border border-black p-1 w-24">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {report.equipment_details?.map((e: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-black p-1">{idx + 1}</td>
                      <td className="border border-black p-1 text-left">{e.machine_supplier_name}</td>
                      <td className="border border-black p-1">{e.start_time ? e.start_time.substring(0,5) : '-'}</td>
                      <td className="border border-black p-1">{e.end_time ? e.end_time.substring(0,5) : '-'}</td>
                      <td className="border border-black p-1">{e.total_hours}</td>
                      <td className="border border-black p-1 text-left">{e.remarks || '-'}</td>
                    </tr>
                  ))}
                  {(!report.equipment_details || report.equipment_details.length === 0) && (
                    <tr>
                      <td className="border border-black p-4" colSpan={6}>No equipment reported.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* E. Expenses */}
            <div className="mb-6">
              <h4 className="bg-red-600 text-white font-bold text-center p-1 uppercase border-y-2 border-black">E. Expenses :-</h4>
              <table className="w-full border-collapse border border-black text-center">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 w-10">Sr. No.</th>
                    <th className="border border-black p-1 w-32">Amount Received</th>
                    <th className="border border-black p-1">Amount Received by / Expenses Particulars</th>
                    <th className="border border-black p-1 w-32">Expenses Amount</th>
                    <th className="border border-black p-1 w-32">Closing Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expense_details?.map((e: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-black p-1">{idx + 1}</td>
                      <td className="border border-black p-1">{e.amount_received ? `₹${e.amount_received}` : '-'}</td>
                      <td className="border border-black p-1 text-left">{e.particulars}</td>
                      <td className="border border-black p-1">{e.expense_amount ? `₹${e.expense_amount}` : '-'}</td>
                      <td className="border border-black p-1 font-bold">₹{e.closing_balance}</td>
                    </tr>
                  ))}
                  {(!report.expense_details || report.expense_details.length === 0) && (
                    <tr>
                      <td className="border border-black p-4" colSpan={5}>No expenses reported.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* F. Tomorrow's Planning */}
            <div className="mb-20">
              <h4 className="bg-red-600 text-white font-bold text-center p-1 uppercase border-y-2 border-black">F. Tomorrows Planning & Requirments : -</h4>
              <table className="w-full border-collapse border border-black text-center">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 w-10">Sr. No.</th>
                    <th className="border border-black p-1">Tomorrows Plan Activity</th>
                    <th className="border border-black p-1">Plan activity additional Requirments</th>
                  </tr>
                </thead>
                <tbody>
                  {report.planning_details?.map((p: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-black p-1">{idx + 1}</td>
                      <td className="border border-black p-1 text-left">{p.plan_activity}</td>
                      <td className="border border-black p-1 text-left">{p.requirements || '-'}</td>
                    </tr>
                  ))}
                  {(!report.planning_details || report.planning_details.length === 0) && (
                    <tr>
                      <td className="border border-black p-4" colSpan={3}>No planning reported.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Signature Area */}
            <div className="flex justify-between mt-20 p-4 font-bold pb-10">
              <div>
                <p className="italic font-normal text-xs mb-8">Note :- Share daily work activity Geotag Photos.</p>
              </div>
              <div className="text-center pt-8 border-t border-black w-48">
                Sign of Site Incharge
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container shrink-0">
          <button onClick={() => window.print()} className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md">
            <span className="material-symbols-outlined">print</span> Print Report
          </button>
        </div>
      </div>
    </div>
  );
};
