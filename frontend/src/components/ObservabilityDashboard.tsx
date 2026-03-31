import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, ShieldCheck, Clock, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PolicyDocument, ObservabilityTelemetry } from '../types';

export const ObservabilityDashboard: React.FC<{ documents: PolicyDocument[] }> = ({ documents }) => {
  const [telemetry, setTelemetry] = useState<ObservabilityTelemetry | null>(null);

  useEffect(() => {
    fetch('/api/v1/observability/telemetry')
      .then(res => res.json())
      .then(data => setTelemetry(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Total Corpus Documents</span>
          <p className="text-2xl font-bold text-white mt-1">{telemetry?.metrics.total_docs || documents.length}</p>
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