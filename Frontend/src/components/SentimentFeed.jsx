import React from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const SentimentFeed = ({ news }) => {
  if (!news || news.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl text-center text-slate-400">
        No recent news items were loaded for sentiment parsing.
      </div>
    );
  }

  const getSentimentStyles = (sent) => {
    switch (sent) {
      case 'Bullish':
        return {
          bg: 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/35',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300',
          icon: <TrendingUp className="w-3.5 h-3.5" />
        };
      case 'Bearish':
        return {
          bg: 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/35',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300',
          icon: <TrendingDown className="w-3.5 h-3.5" />
        };
      default:
        return {
          bg: 'bg-slate-500/5 border-slate-500/10 hover:border-slate-500/35',
          text: 'text-slate-400',
          badge: 'bg-slate-500/20 text-slate-300',
          icon: <Minus className="w-3.5 h-3.5" />
        };
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {news.map((item, idx) => {
        const styles = getSentimentStyles(item.sentiment);
        return (
          <div
            key={idx}
            className={`border rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between ${styles.bg}`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {item.publisher}
                </span>
                <span className={`flex items-center space-x-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase ${styles.badge}`}>
                  {styles.icon}
                  <span>{item.sentiment}</span>
                </span>
              </div>
              <h4 className="font-semibold text-sm text-slate-100 line-clamp-2">
                {item.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "{item.summary}"
              </p>
            </div>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-1 text-xs font-semibold mt-4 transition-all hover:underline self-start ${styles.text}`}
              >
                <span>Read Original</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};
export default SentimentFeed;
