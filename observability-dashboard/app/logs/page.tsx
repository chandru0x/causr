"use client";

import { API_BASE } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

type Row = Record<string, unknown>;

export default function LogsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [service, setService] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    const t = setInterval(async () => {
      const r = await fetch(`${API_BASE}/api/logs/recent`);
      if (r.ok) setRows((await r.json()) as Row[]);
    }, 2000);
    void (async () => {
      const r = await fetch(`${API_BASE}/api/logs/recent`);
      if (r.ok) setRows((await r.json()) as Row[]);
    })();
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((x) => {
      const sn = String(x.service_name ?? "");
      const lv = String(x.log_level ?? "");
      if (service && !sn.toLowerCase().includes(service.toLowerCase())) return false;
      if (level && !lv.toLowerCase().includes(level.toLowerCase())) return false;
      return true;
    });
  }, [rows, service, level]);

  return (
    <main>
      <h1 className="text-xl font-semibold mb-4">Logs</h1>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          className="border rounded px-2 py-1 text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
          placeholder="Service filter"
          value={service}
          onChange={(e) => setService(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1 text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
          placeholder="Level filter"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-900">
            <tr>
              <th className="text-left p-2">Time</th>
              <th className="text-left p-2">Service</th>
              <th className="text-left p-2">Level</th>
              <th className="text-left p-2">Cluster</th>
              <th className="text-left p-2">Score</th>
              <th className="text-left p-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="p-2 whitespace-nowrap">{String(r.timestamp ?? "")}</td>
                <td className="p-2">{String(r.service_name ?? "")}</td>
                <td className="p-2">{String(r.log_level ?? "")}</td>
                <td className="p-2">
                  <span className="inline-block rounded bg-violet-100 dark:bg-violet-900/40 px-1.5 py-0.5 text-xs">
                    {String(r.cluster_id ?? "—")}
                  </span>
                </td>
                <td className="p-2">{String(r.anomaly_score ?? "")}</td>
                <td className="p-2 max-w-md truncate">{String(r.message ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
