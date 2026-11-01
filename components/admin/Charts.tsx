"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface StockChartProps {
  data: {
    group: string;
    units: number;
    status: string;
  }[];
}

export function StockBarChart({ data }: StockChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-400">No stock data available</div>;
  }

  const getBarColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "#10b981"; // emerald-500
      case "LOW_STOCK":
        return "#f59e0b"; // amber-500
      case "CRITICAL":
        return "#f43f5e"; // rose-500
      case "OUT_OF_STOCK":
        return "#be123c"; // rose-700
      default:
        return "#64748b";
    }
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="group" stroke="#64748b" fontSize={12} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs">
                    <p className="font-bold text-slate-900 text-sm">{item.group}</p>
                    <p className="text-slate-600 mt-1">
                      Units: <span className="font-bold text-slate-900">{item.units}</span>
                    </p>
                    <p className="text-slate-500 capitalize">Status: {item.status.replace("_", " ")}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="units" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface RequestChartProps {
  data: {
    status: string;
    count: number;
  }[];
}

export function RequestStatusChart({ data }: RequestChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-400">No request data</div>;
  }

  const COLORS: Record<string, string> = {
    PENDING: "#f59e0b",   // Amber
    APPROVED: "#0284c7",  // Sky
    FULFILLED: "#10b981", // Emerald
    REJECTED: "#f43f5e",  // Rose
    CANCELLED: "#94a3b8", // Slate
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={45}
            paddingAngle={3}
            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.status] || "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
