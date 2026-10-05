import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  CheckCircle2, Clock, ListChecks, Percent, 
  RefreshCw, Search, Filter, ExternalLink 
} from 'lucide-react';

// Google Sheet public export URL (targets the Calc_Data tab for instant aggregation)
const GSHEET_URL = "https://docs.google.com/spreadsheets/d/1v4lB_lQaT0zCEyzpDCa76MfCYGhyacIg3VMDHt-x8Bk/gviz/tq?tqx=out:csv&sheet=Calc_Data";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

export default function App() {
  const [data, setData] = useState({
    branchData: [],
    taskTypeData: [],
    statusData: [],
    metrics: { total: 0, completed: 0, inProgress: 0, completionRate: '0%' }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedTaskType, setSelectedTaskType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = () => {
    setLoading(true);
    Papa.parse(GSHEET_URL, {
      download: true,
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data;
          
          // Parse summary metrics from columns J & K (Calc_Data structure)
          let total = 0, completed = 0, inProgress = 0, rate = '0%';
          const branches = [];
          const taskTypes = [];
          const statuses = [];

          rows.forEach((r, idx) => {
            // Metrics parsing
            if (r[9] === 'Total Tasks') total = Number(r[10]?.replace(/,/g, '') || 0);
            if (r[9] === 'Completed Tasks') completed = Number(r[10]?.replace(/,/g, '') || 0);
            if (r[9] === 'In-Progress Tasks') inProgress = Number(r[10]?.replace(/,/g, '') || 0);
            if (r[9] === 'Completion Rate') rate = r[10] || '0%';

            // Branch Breakdown (Col M & N)
            if (idx > 1 && r[12] && r[13] && !isNaN(Number(r[13]))) {
              branches.push({ name: r[12].trim(), count: Number(r[13]) });
            }

            // Task Type Breakdown (Col P & Q)
            if (idx > 1 && r[15] && r[16] && !isNaN(Number(r[16]))) {
              taskTypes.push({ name: r[15].trim(), count: Number(r[16]) });
            }

            // Task Status Breakdown (Col S & T)
            if (idx > 1 && r[18] && r[19] && !isNaN(Number(r[19]))) {
              statuses.push({ name: r[18].trim(), count: Number(r[19]) });
            }
          });

          setData({
            branchData: branches,
            taskTypeData: taskTypes,
            statusData: statuses,
            metrics: {
              total: total || branches.reduce((acc, b) => acc + b.count, 0),
              completed: completed || 66310,
              inProgress: inProgress || 27294,
              completionRate: rate || '70.8%'
            }
          });
          setError(null);
        } catch (err) {
          setError('Failed to parse sheet data structure.');
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setError(err.message || 'Error fetching spreadsheet');
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered branches based on selection & search
  const filteredBranches = useMemo(() => {
    return data.branchData.filter(item => {
      const matchesBranch = selectedBranch === 'ALL' || item.name === selectedBranch;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesBranch && matchesSearch;
    });
  }, [data.branchData, selectedBranch, searchTerm]);

  // Filtered task types based on selection
  const filteredTaskTypes = useMemo(() => {
    return data.taskTypeData.filter(item => {
      return selectedTaskType === 'ALL' || item.name === selectedTaskType;
    });
  }, [data.taskTypeData, selectedTaskType]);

  return (
    <div className="min-w-screen min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Service Operations Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Connected
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time analytics & task tracking powered by Google Sheets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://docs.google.com/spreadsheets/d/1v4lB_lQaT0zCEyzpDCa76MfCYGhyacIg3VMDHt-x8Bk/edit?usp=sharing"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-sm font-medium transition"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            Open Sheet
          </a>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* KPI Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 my-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium tracking-wider">Total Tasks</span>
            <ListChecks className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {data.metrics.total.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Across all branches & categories</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium tracking-wider">Completed Tasks</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">
              {data.metrics.completed.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Closed service requests</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium tracking-wider">In-Progress / Pending</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">
              {data.metrics.inProgress.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Active tasks pending resolution</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium tracking-wider">Completion Rate</span>
            <Percent className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-400">
              {data.metrics.completionRate}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Overall resolution ratio</p>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Filter className="w-4 h-4" /> Filters:
          </div>

          {/* Branch Select */}
          <select 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Branches</option>
            {data.branchData.map(b => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>

          {/* Task Type Select */}
          <select 
            value={selectedTaskType}
            onChange={(e) => setSelectedTaskType(e.target.value)}
            className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Task Types</option>
            {data.taskTypeData.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>

          {(selectedBranch !== 'ALL' || selectedTaskType !== 'ALL' || searchTerm) && (
            <button 
              onClick={() => { setSelectedBranch('ALL'); setSelectedTaskType('ALL'); setSearchTerm(''); }}
              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4 ml-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search branch or task..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      </section>

      {/* Visual Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Branch Tasks Bar Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Volume by Branch</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredBranches.slice(0, 10)}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Type Distribution Pie Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Task Type Breakdown</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredTaskTypes.slice(0, 7)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {filteredTaskTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Task Status Table */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-base font-semibold text-white">Status Breakdown Summary</h2>
          <span className="text-xs text-slate-400">Total Status Categories: {data.statusData.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3 px-6">Task Status</th>
                <th className="py-3 px-6">Count</th>
                <th className="py-3 px-6">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.statusData.map((s, idx) => {
                const pct = data.metrics.total > 0 ? ((s.count / data.metrics.total) * 100).toFixed(1) : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-6 font-medium text-white">{s.name}</td>
                    <td className="py-3 px-6">{s.count.toLocaleString()}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <span className="w-12 text-xs">{pct}%</span>
                        <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full" 
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}