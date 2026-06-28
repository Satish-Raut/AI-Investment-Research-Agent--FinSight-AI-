import React, { useState } from 'react';

export const FinancialTable = ({ financials }) => {
  const [activeTab, setActiveTab] = useState('income');

  if (!financials) return null;

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (Math.abs(num) >= 1.0e9) {
      return (num / 1.0e9).toFixed(2) + 'B';
    }
    if (Math.abs(num) >= 1.0e6) {
      return (num / 1.0e6).toFixed(2) + 'M';
    }
    return num.toLocaleString();
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'balance':
        return {
          title: 'Balance Sheet (Annual)',
          headers: ['Period End', 'Total Assets', 'Total Liabilities', 'Cash Reserves', 'Short-Term Inv.', 'Long-Term Debt'],
          keys: ['endDate', 'totalAssets', 'totalLiab', 'cash', 'shortTermInvestments', 'longTermDebt'],
          data: financials.balanceSheet || []
        };
      case 'cashflow':
        return {
          title: 'Cash Flow (Annual)',
          headers: ['Period End', 'Operating Cash Flow', 'Capital Expend. (CapEx)', 'Free Cash Flow'],
          keys: ['endDate', 'totalCashFromOperatingActivities', 'capitalExpenditures', 'freeCashflow'],
          data: financials.cashflowStatement || []
        };
      default:
        return {
          title: 'Income Statement (Annual)',
          headers: ['Period End', 'Total Revenue', 'Gross Profit', 'Operating Income', 'Net Income'],
          keys: ['endDate', 'totalRevenue', 'grossProfit', 'operatingIncome', 'netIncome'],
          data: financials.incomeStatement || []
        };
    }
  };

  const current = getActiveData();

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 space-y-3 sm:space-y-0">
        <h3 className="font-semibold text-slate-200">{current.title}</h3>
        <div className="flex p-0.5 bg-slate-950/80 rounded-xl border border-white/5 self-start">
          {[
            { key: 'income', label: 'Income' },
            { key: 'balance', label: 'Balance Sheet' },
            { key: 'cashflow', label: 'Cash Flow' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${activeTab === tab.key ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {current.data.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          No financial data reported for this statement.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400">
                {current.headers.map((h, i) => (
                  <th key={i} className="pb-3 font-semibold uppercase tracking-wider px-3 first:pl-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {current.data.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  {current.keys.map((k, colIdx) => (
                    <td key={colIdx} className="py-3.5 px-3 first:pl-0 font-medium text-slate-200">
                      {k === 'endDate' ? row[k] : formatNumber(row[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default FinancialTable;
