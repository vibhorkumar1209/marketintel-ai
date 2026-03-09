'use client';

import React from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Area, AreaChart, ReferenceLine, ComposedChart
} from 'recharts';

// ─── Colour palette ────────────────────────────────────────────────────────────
const PALETTE = ['#00BFA5', '#1565C0', '#F57C00', '#6A1B9A', '#AD1457', '#2E7D32'];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChartSpec {
    type?: string;
    title?: string;
    xAxis?: string | { label?: string; values?: number[] | string[] };
    yAxis?: string | { label?: string; range?: number[]; min?: number; max?: number };
    data_source?: string;
}

interface SizingData {
    validated_market_size?: { value?: number; unit?: string };
    cagr_estimate?: { value?: number; period?: string };
    top_down?: {
        TAM?: { value?: number };
        SAM?: { value?: number };
        SOM?: { value?: number };
        scenario_band?: { low?: number; base?: number; high?: number };
    };
}

interface ReportChartProps {
    chartSpec: ChartSpec;
    sizing?: SizingData;
    tableData?: {
        title?: string;
        headers?: string[];
        rows?: any[][];
    };
}

// ─── Data generation helpers ───────────────────────────────────────────────────

function buildForecastData(sizing: SizingData | undefined, years?: number[]) {
    const base = sizing?.validated_market_size?.value ?? 2.77;
    const cagr = (sizing?.cagr_estimate?.value ?? 6.27) / 100;
    const yrs = years?.length ? years : [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];
    const baseYear = yrs[0];
    return yrs.map(yr => {
        const n = yr - baseYear;
        const val = +(base * Math.pow(1 + cagr, n)).toFixed(2);
        return {
            year: yr,
            value: val,
            low: +(val * 0.85).toFixed(2),
            high: +(val * 1.15).toFixed(2),
            cagrLine: val // used as the line graph point
        };
    });
}

function buildStackedTimeSeriesData(tableData: any, sizing: SizingData | undefined) {
    const yrs = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];
    const baseYear = yrs[0];

    let segments: { name: string; size: number; cagr: number }[] = [];
    if (tableData && tableData.rows && tableData.rows.length > 0) {
        segments = tableData.rows.map((row: any) => {
            const cells = Array.isArray(row) ? row : Object.values(row as object);
            let size = parseFloat(String(cells[1] || '').replace(/[^0-9.]/g, ''));
            let cagr = 5.0;
            for (let i = cells.length - 1; i >= 2; i--) {
                const val = parseFloat(String(cells[i] || '').replace(/[^0-9.-]/g, ''));
                if (!isNaN(val) && val < 50 && val > -50) {
                    cagr = val;
                    break;
                }
            }
            if (isNaN(size)) size = 0;
            return { name: String(cells[0] || 'Unknown').substring(0, 15), size, cagr: cagr / 100 };
        }).filter((s: any) => s.size > 0);
    }

    if (segments.length === 0) {
        const base = sizing?.validated_market_size?.value ?? 10;
        const cagr = (sizing?.cagr_estimate?.value ?? 5) / 100;
        segments = [
            { name: 'Segment A', size: base * 0.6, cagr: cagr * 1.1 },
            { name: 'Segment B', size: base * 0.3, cagr: cagr * 0.9 },
            { name: 'Segment C', size: base * 0.1, cagr: cagr },
        ];
    }

    return {
        keys: segments.map(s => s.name),
        data: yrs.map(yr => {
            const n = yr - baseYear;
            const pt: any = { year: yr };
            let total = 0;
            segments.forEach(seg => {
                const val = +(seg.size * Math.pow(1 + seg.cagr, n)).toFixed(2);
                pt[seg.name] = val;
                total += val;
            });
            pt.cagrLine = +total.toFixed(2);
            return pt;
        })
    };
}

function buildTamSamSomData(sizing: SizingData | undefined) {
    const td = sizing?.top_down;
    return [
        { name: 'TAM', value: +(td?.TAM?.value ?? 15) },
        { name: 'SAM', value: +(td?.SAM?.value ?? 2.77) },
        { name: 'SOM', value: +(td?.SOM?.value ?? 0.5) },
    ];
}

function buildWaterfallData(spec: ChartSpec, sizing: SizingData | undefined) {
    const xLabels = Array.isArray(spec.xAxis) ? spec.xAxis as string[] :
        (typeof spec.xAxis === 'object' && spec.xAxis !== null && 'values' in spec.xAxis
            ? (spec.xAxis as { values?: (string | number)[] }).values ?? []
            : []);
    const base = sizing?.validated_market_size?.value ?? 2.77;
    const cagr = (sizing?.cagr_estimate?.value ?? 6.27) / 100;
    if (xLabels.length === 0) {
        return [
            { name: '2024 Base', value: base, fill: PALETTE[1] },
            { name: 'CAGR Growth', value: +(base * Math.pow(1 + cagr, 6) - base).toFixed(2), fill: PALETTE[0] },
            { name: '2030 Projected', value: +(base * Math.pow(1 + cagr, 6)).toFixed(2), fill: PALETTE[4] },
        ];
    }
    return xLabels.map((label, i) => ({
        name: String(label).replace(/ /g, '\n'),
        value: +(base + (i / (xLabels.length - 1)) * base * 0.7).toFixed(2),
        fill: PALETTE[i % PALETTE.length],
    }));
}

// ─── Chart tooltip ─────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0A1628] border border-[#2A3A55] rounded-lg p-3 shadow-xl text-sm">
            <p className="text-[#8899BB] mb-1 font-medium">{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} style={{ color: entry.color || '#00BFA5' }}>
                    {entry.name}: <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
                </p>
            ))}
        </div>
    );
};

// ─── Main component ────────────────────────────────────────────────────────────

export default function ReportChart({ chartSpec, sizing, tableData }: ReportChartProps) {
    const type = chartSpec?.type?.toLowerCase() ?? '';
    const xAxisValues = typeof chartSpec?.xAxis === 'object' && chartSpec?.xAxis !== null && 'values' in chartSpec.xAxis
        ? (chartSpec.xAxis as { values?: (string | number)[] }).values ?? []
        : [];
    const yLabel = typeof chartSpec?.yAxis === 'object' && chartSpec?.yAxis !== null && 'label' in chartSpec.yAxis
        ? (chartSpec.yAxis as { label?: string }).label ?? ''
        : typeof chartSpec?.yAxis === 'string' ? chartSpec.yAxis : 'Value';

    // ── Combination/Composed (Market Size & Forecast) ──────────────────────
    if (type.includes('combination') || type.includes('composed')) {
        const data = buildForecastData(sizing, xAxisValues as number[]);
        return (
            <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1B2A4A" />
                    <XAxis dataKey="year" stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 12 }} />
                    <YAxis yAxisId="left" stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 12 }} label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#8899BB', fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#00BFA5" tick={{ fill: '#00BFA5', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#8899BB', fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="value" name="Market Size" fill="#1565C0" radius={[4, 4, 0, 0]} barSize={30} />
                    <Line yAxisId="right" type="monotone" dataKey="cagrLine" stroke="#00BFA5" strokeWidth={3} name="CAGR Trend" dot={{ r: 4, fill: '#00BFA5' }} />
                </ComposedChart>
            </ResponsiveContainer>
        );
    }

    // ── Stacked Column + Line (Segmentation) ──────────────────────────────────
    if (type.includes('stacked_column')) {
        const { keys, data } = buildStackedTimeSeriesData(tableData, sizing);
        return (
            <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1B2A4A" />
                    <XAxis dataKey="year" stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 12 }} />
                    <YAxis yAxisId="left" stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 12 }} label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#8899BB', fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#00BFA5" tick={{ fill: '#00BFA5', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#8899BB', fontSize: 12 }} />
                    {keys.map((key, i) => (
                        <Bar key={key} yAxisId="left" dataKey={key} stackId="a" fill={PALETTE[i % PALETTE.length]} radius={i === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} barSize={30} />
                    ))}
                    <Line yAxisId="right" type="monotone" dataKey="cagrLine" stroke="#00BFA5" strokeWidth={3} name="Total CAGR Trend" dot={false} strokeDasharray="5 5" />
                </ComposedChart>
            </ResponsiveContainer>
        );
    }

    // ── Market forecast / line / area ──────────────────────────────────────────
    if (type.includes('line') || type.includes('forecast') || type.includes('area') ||
        type === '' || type.includes('trend')) {
        const data = buildForecastData(sizing, xAxisValues as number[]);
        return (
            <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00BFA5" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#00BFA5" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradBand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1565C0" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1B2A4A" />
                    <XAxis dataKey="year" stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 12 }} />
                    <YAxis stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 12 }} label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#8899BB', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#8899BB', fontSize: 12 }} />
                    <Area type="monotone" dataKey="high" fill="url(#gradBand)" stroke="#1565C0" strokeDasharray="4 4" strokeWidth={1} name="High scenario" />
                    <Area type="monotone" dataKey="value" fill="url(#gradValue)" stroke="#00BFA5" strokeWidth={2.5} name="Base forecast" dot={{ r: 4, fill: '#00BFA5' }} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="low" fill="url(#gradBand)" stroke="#F57C00" strokeDasharray="4 4" strokeWidth={1} name="Low scenario" />
                </AreaChart>
            </ResponsiveContainer>
        );
    }

    // ── TAM / SAM / SOM bar ────────────────────────────────────────────────────
    if (type.includes('tam') || type.includes('sizing') || type.includes('funnel')) {
        const data = buildTamSamSomData(sizing);
        return (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1B2A4A" />
                    <XAxis dataKey="name" stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 12 }} />
                    <YAxis stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="USD Billion" radius={[4, 4, 0, 0]}>
                        {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    }

    // ── Waterfall / opportunity ────────────────────────────────────────────────
    if (type.includes('waterfall') || type.includes('opportunity')) {
        const data = buildWaterfallData(chartSpec, sizing);
        return (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1B2A4A" />
                    <XAxis dataKey="name" stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                    <YAxis stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((entry, i) => <Cell key={i} fill={entry.fill || PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    }

    // ── Pie / market share ─────────────────────────────────────────────────────
    if (type.includes('pie') || type.includes('donut') || type.includes('share')) {
        let segments: any[] = [];
        if (tableData && tableData.rows && tableData.rows.length > 0) {
            segments = tableData.rows.map(row => {
                const cells = Array.isArray(row) ? row : Object.values(row as object);
                let val = parseFloat(String(cells[1] || '').replace(/[^0-9.]/g, ''));
                if (isNaN(val) && cells.length > 2) val = parseFloat(String(cells[2] || '').replace(/[^0-9.]/g, ''));
                return { name: String(cells[0] || 'Unknown').substring(0, 12), value: isNaN(val) ? 0 : val };
            }).filter(s => s.value > 0).slice(0, 8);
        }
        if (segments.length === 0) {
            segments = [
                { name: 'Motorcycles', value: 58 },
                { name: 'Scooters', value: 28 },
                { name: 'Mopeds & Other', value: 9 },
                { name: 'Electric', value: 5 },
            ];
        }
        return (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={segments} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                        dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={{ stroke: '#8899BB' }}>
                        {segments.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#8899BB', fontSize: 12 }} />
                </PieChart>
            </ResponsiveContainer>
        );
    }

    // ── Competitive matrix / bar fallback ──────────────────────────────────────
    let competitorData: any[] = [];
    if (tableData && tableData.rows && tableData.rows.length > 0) {
        competitorData = tableData.rows.map(row => {
            const cells = Array.isArray(row) ? row : Object.values(row as object);
            let val = parseFloat(String(cells[1] || '').replace(/[^0-9.]/g, ''));
            if (isNaN(val) && cells.length > 2) val = parseFloat(String(cells[2] || '').replace(/[^0-9.]/g, ''));
            return { name: String(cells[0] || 'Unknown').substring(0, 15), share: isNaN(val) ? 0 : val };
        }).filter(s => s.share > 0).slice(0, 10);
    }
    if (competitorData.length === 0) {
        competitorData = [
            { name: 'Honda', share: 28 },
            { name: 'Yamaha', share: 22 },
            { name: 'Kawasaki', share: 18 },
            { name: 'Suzuki', share: 14 },
            { name: 'KTM', share: 10 },
            { name: 'Others', share: 8 },
        ];
    }
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={competitorData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1B2A4A" horizontal={false} />
                <XAxis type="number" stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" stroke="#8899BB" tick={{ fill: '#8899BB', fontSize: 12 }} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#8899BB', fontSize: 12 }} />
                <Bar dataKey="share" name="Value" fill="#00BFA5" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
