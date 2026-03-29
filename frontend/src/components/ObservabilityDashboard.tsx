import React from 'react';
import { BarChart3, Activity, ShieldCheck, Clock } from 'lucide-react';
import { PolicyDocument } from '../types';

export const ObservabilityDashboard: React.FC<{ documents: PolicyDocument[] }> = ({ documents }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Total Corpus Documents</span>
          <p className="text-2xl font-bold text-white mt-1">{documents.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Average Quality Score</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">94.2%</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Grounded Query Ratio</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">83.3%</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Mean Latency</span>
          <p className="text-2xl font-bold text-purple-400 mt-1">0.35s</p>
        </div>
      </div>
    </div>
  );
};