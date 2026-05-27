"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, type Role, saveUser } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await api.register({
        rrEmail: email,
        rrName: name,
        rrPassword: password,
        rrRole: role,
      });
      saveUser(user);
      router.push("/modules");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Criar conta</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nome">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:border-pink-400 outline-none"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:border-pink-400 outline-none"
          />
        </Field>
        <Field label="Senha (mínimo 6 caracteres)">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:border-pink-400 outline-none"
          />
        </Field>
        <Field label="Perfil">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:border-pink-400 outline-none"
          >
            <option value="Student">Aluno</option>
            <option value="Teacher">Professor</option>
          </select>
        </Field>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-pink-500 text-white text-sm hover:bg-pink-400 disabled:opacity-50"
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-slate-300">{label}</span>
      {children}
    </label>
  );
}
