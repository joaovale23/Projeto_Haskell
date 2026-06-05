"use client";

import { useEffect, useState } from "react";
import {
  api,
  type DashboardData,
  type DashboardModuleStat,
} from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";

export default function DashboardPage() {
  const { ready, allowed } = useRequireRole("Teacher");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    api
      .getDashboard()
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar painel")
      );
  }, [allowed]);

  if (!ready) return <p className="text-slate-400">Carregando...</p>;
  if (!allowed) return null;
  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-slate-400">Carregando...</p>;

  const topCompletion = [...data.dbModules]
    .sort((a, b) => b.dmsCompletionRate - a.dmsCompletionRate)
    .slice(0, 3);
  const worstAccuracy = data.dbModules
    .filter((m) => m.dmsAttempts > 0)
    .sort((a, b) => a.dmsAccuracyRate - b.dmsAccuracyRate)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Painel do professor</h1>

      {/* Indicadores gerais */}
      <section className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Stat label="Alunos" value={data.dbTotalStudents} />
        <Stat label="Módulos" value={data.dbTotalModules} />
        <Stat label="Exercícios" value={data.dbTotalExercises} />
        <Stat label="Respostas enviadas" value={data.dbTotalAttempts} />
      </section>

      {/* Métricas de desempenho */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Panel title="Progresso médio das turmas">
          <Gauge value={data.dbAvgProgress} />
        </Panel>
        <Panel title="Taxa média de acertos">
          <Gauge value={data.dbAccuracyRate} tone="emerald" />
        </Panel>
        <Panel title="Alunos ativos (14 dias)">
          <p className="text-3xl font-semibold">{data.dbActiveStudents}</p>
          <p className="text-xs text-slate-500 mt-1">
            de {data.dbTotalStudents} alunos
          </p>
        </Panel>
        <Panel title="Alunos com baixo progresso">
          <p className="text-3xl font-semibold text-amber-400">
            {data.dbLowProgressStudents}
          </p>
          <p className="text-xs text-slate-500 mt-1">progresso abaixo de 30%</p>
        </Panel>
      </section>

      {/* Rankings */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Panel title="Maior taxa de conclusão">
          <RankList
            items={topCompletion}
            metric={(m) => `${m.dmsCompletionRate.toFixed(0)}%`}
            empty="Sem dados de conclusão."
          />
        </Panel>
        <Panel title="Menor taxa de acertos">
          <RankList
            items={worstAccuracy}
            metric={(m) => `${m.dmsAccuracyRate.toFixed(0)}%`}
            empty="Sem respostas registradas ainda."
          />
        </Panel>
      </section>

      {/* Desempenho por módulo */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Desempenho por módulo</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 text-left">
              <tr className="border-b border-slate-800">
                <th className="py-2 pr-4 font-medium">Módulo</th>
                <th className="py-2 px-4 font-medium">Conclusão</th>
                <th className="py-2 px-4 font-medium">Acertos</th>
                <th className="py-2 pl-4 font-medium text-right">Respostas</th>
              </tr>
            </thead>
            <tbody>
              {data.dbModules.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-slate-500">
                    Nenhum módulo cadastrado.
                  </td>
                </tr>
              )}
              {data.dbModules.map((m) => (
                <tr key={m.dmsModuleId} className="border-b border-slate-900">
                  <td className="py-2 pr-4">{m.dmsTitle}</td>
                  <td className="py-2 px-4 w-40">
                    <Bar value={m.dmsCompletionRate} />
                  </td>
                  <td className="py-2 px-4 w-40">
                    <Bar value={m.dmsAccuracyRate} tone="emerald" />
                  </td>
                  <td className="py-2 pl-4 text-right text-slate-400">
                    {m.dmsAttempts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Atividades recentes + novos alunos */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Panel title="Respostas recentes">
          {data.dbRecentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma resposta ainda.</p>
          ) : (
            <ul className="space-y-2">
              {data.dbRecentActivity.map((a, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className={a.dacCorrect ? "text-emerald-400" : "text-red-400"}>
                    {a.dacCorrect ? "✓" : "✗"}
                  </span>
                  <span className="flex-1">
                    <span className="text-slate-200">{a.dacUserName}</span>
                    <span className="text-slate-500"> — {a.dacPrompt}</span>
                  </span>
                  <span className="text-xs text-slate-600 shrink-0">
                    {new Date(a.dacAt).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Novos alunos">
          {data.dbNewStudents.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum aluno cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {data.dbNewStudents.map((s, i) => (
                <li key={i} className="text-sm flex items-center justify-between">
                  <span>
                    <span className="text-slate-200">{s.dstName}</span>
                    <span className="text-slate-500"> · {s.dstEmail}</span>
                  </span>
                  <span className="text-xs text-slate-600 shrink-0">
                    {new Date(s.dstCreatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-800 rounded p-4 bg-slate-900/50">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-800 rounded p-4 bg-slate-900/50 space-y-2">
      <h3 className="text-sm text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

function Gauge({ value, tone = "pink" }: { value: number; tone?: "pink" | "emerald" }) {
  return (
    <div className="space-y-1">
      <p className="text-3xl font-semibold">{value.toFixed(0)}%</p>
      <Bar value={value} tone={tone} />
    </div>
  );
}

function Bar({ value, tone = "pink" }: { value: number; tone?: "pink" | "emerald" }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = tone === "emerald" ? "bg-emerald-500" : "bg-pink-500";
  return (
    <div className="h-2 w-full rounded bg-slate-800 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function RankList({
  items,
  metric,
  empty,
}: {
  items: DashboardModuleStat[];
  metric: (m: DashboardModuleStat) => string;
  empty: string;
}) {
  if (items.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ol className="space-y-1">
      {items.map((m, i) => (
        <li key={m.dmsModuleId} className="text-sm flex items-center justify-between">
          <span className="text-slate-300">
            {i + 1}. {m.dmsTitle}
          </span>
          <span className="text-slate-400">{metric(m)}</span>
        </li>
      ))}
    </ol>
  );
}
