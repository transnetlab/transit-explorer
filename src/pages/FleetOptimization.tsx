import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { API_2_BASES } from '../config';
import { fetchWithFallback } from '../http';

export function FleetOptimization() {
  const navigate = useNavigate();
  const { city } = useParams();

  const [taskCount, setTaskCount] = useState<number>(50);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [viewRange, setViewRange] = useState<[Date, Date] | null>(null);
  const [compact, setCompact] = useState<boolean>(false);
  const [visibleRows, setVisibleRows] = useState<number>(20);
  const [vehicleRows, setVehicleRows] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState<boolean>(false);
  const [selectedDepot, setSelectedDepot] = useState<string>('');
  const [depotOptions, setDepotOptions] = useState<string[]>([]);

  // Deterministic RNG by date
  const rng = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < selectedDate.length; i++) seed = (seed * 31 + selectedDate.charCodeAt(i)) >>> 0;
    return () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return ((seed >>> 0) % 1000000) / 1000000;
    };
  }, [selectedDate]);

  const randomChoice = (arr: string[]) => arr[Math.floor(rng() * arr.length)];
  const routes = useMemo(() => [
    'R-12 Koramangala ↔ Majestic',
    'R-7 Indiranagar ↔ Whitefield',
    'R-21 Paris Line 1',
    'R-33 Dharwad Hubli Shuttle',
    'R-52 Airport Express',
    'R-18 Outer Ring Road'
  ], []);
  const statuses = useMemo(() => ['Scheduled', 'In Service', 'Delayed', 'Maintenance'], []);
  const terminals = useMemo(() => [
    'Majestic', 'Whitefield', 'Indiranagar', 'Koramangala', 'Airport T1', 'Airport T2',
    'Hubli Central', 'Dharwad Depot', 'La Défense', 'Gare du Nord'
  ], []);
  const statusColors: Record<string, string> = {
    'Scheduled': '#3b82f6', // blue-500
    'In Service': '#22c55e', // green-500
    'Delayed': '#f97316', // orange-500
    'Maintenance': '#64748b', // slate-500
  };

  // Fetch vehicles per depot selection. Blank body when selecting all depots.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setVehiclesLoading(true);
        const apiKey = localStorage.getItem('api_key');
        const body = selectedDepot ? { depot_id: selectedDepot } : {};
        const res = await fetchWithFallback(API_2_BASES, '/api/vehicles-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        const arr = Array.isArray(json?.data) ? json.data : (Array.isArray(json?.vehicles) ? json.vehicles : (Array.isArray(json) ? json : []));
        if (!cancelled) {
          const rows = arr || [];
          setVehicleRows(rows);
          // Populate depot options only when fetching all depots
          if (!selectedDepot) {
            const ids = new Set<string>();
            for (const v of rows) {
              const id = (v?.depot_id ?? '').toString().trim();
              if (id) ids.add(id);
            }
            setDepotOptions(Array.from(ids).sort().slice(0, 3));
          }
        }
      } catch {
        if (!cancelled) {
          setVehicleRows([]);
          if (!selectedDepot) setDepotOptions([]);
        }
      } finally {
        if (!cancelled) setVehiclesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDepot]);

  const timelineData = useMemo(() => {
    const dayStart = new Date(`${selectedDate}T06:00:00`);
    const items: Array<{ task: string; start: Date; end: Date; route: string; vehicle: string; status: string; startTerminal: string; endTerminal: string; tripId: string; meta?: any }> = [];
    const rows = vehicleRows.slice(0, taskCount);
    for (let i = 0; i < rows.length; i++) {
      const v = rows[i] || {};
      const startOffsetMin = Math.floor(rng() * 12 * 60);
      const durationMin = Math.max(20, Math.floor(rng() * 180));
      const start = new Date(dayStart.getTime() + startOffsetMin * 60_000);
      const end = new Date(start.getTime() + durationMin * 60_000);
      const route = randomChoice(routes);
      const vehLabelId = v.vehicle_id ?? v.id ?? v.registration_number ?? v.internal_id ?? (i + 1);
      const vehicle = `Bus ${vehLabelId}`;
      const status = randomChoice(statuses);
      const startTerminal = randomChoice(terminals);
      let endTerminal = randomChoice(terminals);
      if (endTerminal === startTerminal) {
        const alts = terminals.filter(t => t !== startTerminal);
        endTerminal = alts.length ? randomChoice(alts) : endTerminal;
      }
      const tripId = `TRIP-${String(Math.floor(rng() * 999999)).padStart(6, '0')}`;
      items.push({ task: `${vehicle}`, start, end, route, vehicle, status, startTerminal, endTerminal, tripId, meta: v });
    }
    items.sort((a, b) => a.start.getTime() - b.start.getTime());
    return items;
  }, [selectedDate, taskCount, rng, routes, vehicleRows, statuses, terminals]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Scheduled': 0, 'In Service': 0, 'Delayed': 0, 'Maintenance': 0 };
    for (const t of timelineData) counts[t.status] = (counts[t.status] ?? 0) + 1;
    return counts;
  }, [timelineData]);

  

  const plotData = useMemo(() => {
    // Create one trace per status for legend toggles and clearer colors
    const byStatus: Record<string, typeof timelineData> = {};
    for (const s of statuses) byStatus[s] = [] as any;
    timelineData.forEach((t) => byStatus[t.status].push(t));

    const traces: any[] = [];
    const fmtVal = (v: any) => (v === null || v === undefined) ? '' : String(v);

    Object.keys(byStatus).forEach((status) => {
      const items = byStatus[status];
      if (!items.length) return;
      const y = items.map((t) => t.task);
      const starts = items.map((t) => t.start);
      const ends = items.map((t) => t.end);
      const durations = ends.map((end, i) => end.getTime() - starts[i].getTime());
      const customdata = items.map((t) => {
        const m = t.meta || {};
        return [
          fmtVal(m.vehicle_id),
          fmtVal(m.seating_cap)
        ];
      });
      traces.push({
        type: 'bar',
        name: status,
        orientation: 'h',
        y,
        x: durations,
        base: starts,
        marker: { color: statusColors[status], line: { color: 'rgba(0,0,0,0.25)', width: 1 } },
        cliponaxis: false,
        hovertemplate:
          '<b>%{y}</b><br>' +
          'Vehicle ID: %{customdata[0]}<br>' +
          'Seated: %{customdata[1]}<br>' +
          '<extra></extra>',
        customdata,
      } as any);
    });
    return traces;
  }, [timelineData, statuses]);

  const layout = useMemo(() => {
    const morningStart = new Date(`${selectedDate}T06:00:00`);
    const eveningEnd = new Date(`${selectedDate}T22:00:00`);

    // Prepare shapes: peak-hour shading and "now" line if applicable
    const shapes: any[] = [];
    const peakBlocks: Array<[string, string, string]> = [
      ['08:00:00', '10:00:00', 'rgba(59,130,246,0.08)'], // blue tint
      ['17:00:00', '19:00:00', 'rgba(244,63,94,0.08)'], // rose tint
    ];
    peakBlocks.forEach(([from, to, color]) => {
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: new Date(`${selectedDate}T${from}`),
        x1: new Date(`${selectedDate}T${to}`),
        y0: 0,
        y1: 1,
        fillcolor: color,
        line: { width: 0 },
        layer: 'below',
      });
    });

    const now = new Date();
    const isToday = now.toISOString().slice(0, 10) === selectedDate;
    if (isToday) {
      const nowX = new Date(`${selectedDate}T${now.toTimeString().slice(0, 8)}`);
      shapes.push({
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: nowX,
        x1: nowX,
        y0: 0,
        y1: 1,
        line: { color: '#ef4444', width: 2, dash: 'dot' },
      });
    }

    return {
      title: `Fleet timeline for ${selectedDate} (${city})`,
      barmode: 'overlay',
      bargap: 0.25,
      legend: { orientation: 'h', x: 1, xanchor: 'right', y: 1.1 },
      xaxis: {
        type: 'date',
        tickformat: '%H:%M',
        rangeslider: { visible: true },
        showgrid: true,
        gridcolor: 'rgba(148,163,184,0.2)',
        zeroline: false,
        range: viewRange ? [viewRange[0], viewRange[1]] : [morningStart, eveningEnd],
      },
      yaxis: { automargin: true, title: 'Route • Vehicle', autorange: 'reversed', tickfont: { size: 12 } },
      margin: { l: 240, r: 20, t: 70, b: 50 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      hovermode: 'closest',
      hoverlabel: {
        bgcolor: '#1f2937', // gray-800
        bordercolor: '#9ca3af', // gray-400
        font: { color: '#ffffff', size: 12 },
        align: 'left'
      },
      shapes,
    } as any;
  }, [selectedDate, city, viewRange]);

  const config = useMemo(() => ({
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['toggleSpikelines', 'autoScale2d'],
    toImageButtonOptions: { format: 'png', filename: `fleet-timeline-${selectedDate}` },
  }), [selectedDate]);

  const chartHeights = useMemo(() => {
    const rows = timelineData.length || taskCount;
    const perRow = compact ? 24 : 34;
    const total = Math.min(4000, Math.max(280, 140 + rows * perRow));
    const visible = Math.max(280, 140 + (Math.max(1, visibleRows)) * perRow);
    return { total, visible, perRow };
  }, [timelineData.length, taskCount, compact, visibleRows]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(`/${city}`)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-blue-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">Fleet Optimization</h1>
            <p className="text-gray-600 dark:text-gray-300">Interactive schedule timeline for {city}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Date</span>
              <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setViewRange(null); }} className="rounded border px-2 py-1 bg-white dark:bg-gray-800" />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Tasks</span>
              <input type="number" min={5} max={60} value={taskCount} onChange={(e) => setTaskCount(Number(e.target.value))} className="w-20 rounded border px-2 py-1 bg-white dark:bg-gray-800" />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Density</span>
              <select value={compact ? 'compact' : 'comfortable'} onChange={(e) => setCompact(e.target.value === 'compact')} className="rounded border px-2 py-1 bg-white dark:bg-gray-800">
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Depot</span>
              <select
                value={selectedDepot}
                onChange={(e) => setSelectedDepot(e.target.value)}
                className="rounded border px-2 py-1 bg-white dark:bg-gray-800"
              >
                <option value="">All depots</option>
                {depotOptions.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Quick view:</span>
            <button onClick={() => setViewRange([new Date(`${selectedDate}T06:00:00`), new Date(`${selectedDate}T12:00:00`)])} className="px-2 py-1 text-sm rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Morning</button>
            <button onClick={() => setViewRange([new Date(`${selectedDate}T12:00:00`), new Date(`${selectedDate}T18:00:00`)])} className="px-2 py-1 text-sm rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Midday</button>
            <button onClick={() => setViewRange([new Date(`${selectedDate}T18:00:00`), new Date(`${selectedDate}T23:00:00`)])} className="px-2 py-1 text-sm rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Evening</button>
            <button onClick={() => setViewRange([new Date(`${selectedDate}T06:00:00`), new Date(`${selectedDate}T22:00:00`)])} className="px-2 py-1 text-sm rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">All day</button>
            <button onClick={() => setViewRange(null)} className="px-2 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700">Reset</button>
            <label className="flex items-center gap-2 ml-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">Rows visible</span>
              <input
                type="number"
                min={5}
                max={60}
                value={visibleRows}
                onChange={(e) => setVisibleRows(Math.max(5, Math.min(60, Number(e.target.value) || 20)))}
                className="w-20 rounded border px-2 py-1 bg-white dark:bg-gray-800"
              />
            </label>
          </div>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-2 mb-1">
          {(['In Service','Scheduled','Delayed','Maintenance'] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border" style={{
              backgroundColor: s === 'Delayed' ? 'rgba(249,115,22,0.08)' : s === 'Maintenance' ? 'rgba(100,116,139,0.08)' : s === 'In Service' ? 'rgba(34,197,94,0.08)' : 'rgba(59,130,246,0.08)',
              borderColor: s === 'Delayed' ? 'rgba(249,115,22,0.3)' : s === 'Maintenance' ? 'rgba(100,116,139,0.3)' : s === 'In Service' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'
            }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s === 'Delayed' ? '#f97316' : s === 'Maintenance' ? '#64748b' : s === 'In Service' ? '#22c55e' : '#3b82f6' }} />
              <span>{s}</span>
              <span className="text-gray-600 dark:text-gray-300">{statusCounts[s]}</span>
            </span>
          ))}
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-3 shadow-lg ring-1 ring-gray-900/5" style={{ maxHeight: chartHeights.visible, overflowY: 'auto' }}>
          {vehiclesLoading ? (
            <div className="h-[320px] flex items-center justify-center text-gray-500">Loading vehicles...</div>
          ) : timelineData.length === 0 ? (
            <div className="h-[320px] flex items-center justify-center text-gray-500">No vehicles for the selected depot.</div>
          ) : (
            <Plot data={plotData} layout={layout} config={config} style={{ width: '100%', height: chartHeights.total }} />
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 pt-2 border-t border-gray-200 dark:border-gray-700">
          Using vehicles-data API for fleet inventory; schedule times are illustrative until real trip schedules are available.
        </p>
      </div>
    </div>
  );
}
