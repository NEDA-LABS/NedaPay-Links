// /components/Charts.tsx
"use client";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#7c6df0", "#a855f7", "#2563eb", "#22c55e", "#f59e0b"];

export function BarByCurrency({
  data,
}: {
  data: { currency: string; total: number }[];
}) {
  console.log("chart data",data)
  return (
    <div className="card p-4 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="currency" stroke="#b6b9e6" />
          <YAxis stroke="#b6b9e6" />
          <Tooltip
            contentStyle={{
              background: "#111633",
              border: "1px solid #1f2a5a",
              color: "#e8eaff",
            }}
          />
          <Bar dataKey="total" fill="#7c6df0" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieByStatus({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="card p-4 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#111633",
              border: "1px solid #1f2a5a",
              color: "#e8eaff",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
