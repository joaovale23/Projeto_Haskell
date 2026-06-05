"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  api,
  clearUser,
  loadUser,
  saveUser,
  type ProfileData,
  type ProfileInput,
} from "@/lib/api";
import { useDeleteConfirm } from "@/lib/useDeleteConfirm";
import { useUser } from "@/lib/useUser";

export default function ProfilePage() {
  const user = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const { ask, dialogProps } = useDeleteConfirm();

  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [semester, setSemester] = useState("");
  const [shift, setShift] = useState("");
  const [discipline, setDiscipline] = useState("");

  function fillForm(p: ProfileData) {
    setName(p.prName);
    setCourse(p.prCourse ?? "");
    setEnrollment(p.prEnrollment ?? "");
    setSemester(p.prSemester ?? "");
    setShift(p.prShift ?? "");
    setDiscipline(p.prDiscipline ?? "");
  }

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    api
      .getProfile()
      .then((p) => {
        setProfile(p);
        fillForm(p);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar perfil")
      );
  }, [user, router]);

  function startEdit() {
    setSaved(false);
    setEditing(true);
  }

  function cancelEdit() {
    if (profile) fillForm(profile);
    setError(null);
    setEditing(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const input: ProfileInput = {
        puName: name,
        puCourse: course.trim() || null,
        puEnrollment: enrollment.trim() || null,
        puSemester: semester.trim() || null,
        puShift: shift.trim() || null,
        puDiscipline: discipline.trim() || null,
      };
      const updated = await api.updateProfile(input);
      setProfile(updated);
      fillForm(updated);
      setSaved(true);
      setEditing(false);
      const u = loadUser();
      if (u) saveUser({ ...u, urName: updated.prName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  function onDeleteAccount() {
    ask({
      title: "Excluir conta",
      message:
        "Sua conta e seus dados (progresso, respostas) serão removidos permanentemente. Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir conta",
      run: async () => {
        await api.deleteProfile();
        clearUser();
        router.replace("/");
      },
    });
  }

  if (error && !profile) return <p className="text-red-400">{error}</p>;
  if (!profile) return <p className="text-slate-400">Carregando...</p>;

  const isTeacher = profile.prRole === "Teacher";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <ConfirmDialog {...dialogProps} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Meu perfil</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isTeacher ? "Professor" : "Aluno"}
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            title="Editar perfil"
            aria-label="Editar perfil"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800"
          >
            <PencilIcon />
            Editar
          </button>
        )}
      </div>

      {saved && !editing && (
        <p className="text-emerald-400 text-sm">Perfil salvo.</p>
      )}

      {editing ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nome">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="E-mail">
            <input value={profile.prEmail} disabled className={`${inputCls} opacity-60`} />
          </Field>

          {isTeacher ? (
            <Field label="Disciplina">
              <input
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className={inputCls}
              />
            </Field>
          ) : (
            <>
              <Field label="Curso">
                <input
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Matrícula">
                <input
                  value={enrollment}
                  onChange={(e) => setEnrollment(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Semestre">
                  <input
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Turno">
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Noturno">Noturno</option>
                  </select>
                </Field>
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-pink-500 text-white text-sm hover:bg-pink-400 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="px-4 py-2 rounded border border-slate-700 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <dl className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <Row label="Nome" value={profile.prName} />
          <Row label="E-mail" value={profile.prEmail} />
          {isTeacher ? (
            <Row label="Disciplina" value={profile.prDiscipline} />
          ) : (
            <>
              <Row label="Curso" value={profile.prCourse} />
              <Row label="Matrícula" value={profile.prEnrollment} />
              <Row label="Semestre" value={profile.prSemester} />
              <Row label="Turno" value={profile.prShift} />
            </>
          )}
        </dl>
      )}

      <div className="pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onDeleteAccount}
          className="text-sm px-3 py-1.5 rounded border border-red-800 text-red-300 hover:bg-red-950"
        >
          Excluir conta
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:border-pink-400 outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-100 text-right">{value && value.trim() ? value : "—"}</dd>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
