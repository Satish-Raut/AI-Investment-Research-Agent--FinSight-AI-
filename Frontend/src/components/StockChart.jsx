import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const StockChart = ({ data, ticker }) => {
  const [timeframe, setTimeframe] = useState(365); // 30, 180, 365

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 glass-panel rounded-xl">
        No chart coordinates available for this asset.
      </div>
    );
  }

  const filteredData = data.slice(-timeframe);
  const startPrice = filteredData[0]?.close || 0;
  const endPrice = filteredData[filteredData.length - 1]?.close || 0;
  const pctChange = startPrice ? ((endPrice - startPrice) / startPrice) * 100 : 0;

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Performance Chart ({ticker})</h3>
          <p className="text-xl font-bold flex items-baseline space-x-2 mt-1">
            <span>${endPrice.toFixed(2)}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pctChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%
            </span>
          </p>
        </div>
        <div className="flex space-x-2 bg-slate-950/80 p-1.5 rounded-xl border border-white/5">
          {[
            { label: '1M', val: 30 },
            { label: '6M', val: 180 },
            { label: '1Y', val: 365 }
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => setTimeframe(opt.val)}
              className={`px-3.5 py-1 text-xs font-medium rounded-lg transition-all ${timeframe === opt.val ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25' : 'text-slate-400 hover:text-white'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={pctChange >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={pctChange >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              dy={10}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              dx={-5}
            />
            <Tooltip
              contentStyle={{ background: '#0d101c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
              labelStyle={{ color: '#64748b', fontSize: '11px' }}
              itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
              formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Close']}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={pctChange >= 0 ? '#10b981' : '#f43f5e'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorClose)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default StockChart;
