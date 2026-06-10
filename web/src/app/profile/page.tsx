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
import {
  Button,
  ErrorText,
  Field,
  Input,
  Loading,
  PageHeader,
  Select,
} from "@/components/ui";

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

  if (error && !profile) return <ErrorText>{error}</ErrorText>;
  if (!profile) return <Loading />;

  const isTeacher = profile.prRole === "Teacher";

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <ConfirmDialog {...dialogProps} />

      <PageHeader
        title="Meu perfil"
        description={isTeacher ? "Professor" : "Aluno"}
        actions={
          !editing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={startEdit}
              title="Editar perfil"
              aria-label="Editar perfil"
            >
              <PencilIcon />
              Editar
            </Button>
          )
        }
      />

      {saved && !editing && (
        <p className="text-sm text-emerald-400">Perfil salvo.</p>
      )}

      {editing ? (
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Nome">
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <Field label="E-mail">
            <Input value={profile.prEmail} disabled />
          </Field>

          {isTeacher ? (
            <Field label="Disciplina">
              <Input
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
              />
            </Field>
          ) : (
            <>
              <Field label="Curso">
                <Input value={course} onChange={(e) => setCourse(e.target.value)} />
              </Field>
              <Field label="Matrícula">
                <Input
                  value={enrollment}
                  onChange={(e) => setEnrollment(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Semestre">
                  <Input
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  />
                </Field>
                <Field label="Turno">
                  <Select value={shift} onChange={(e) => setShift(e.target.value)}>
                    <option value="">—</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Noturno">Noturno</option>
                  </Select>
                </Field>
              </div>
            </>
          )}

          {error && <ErrorText>{error}</ErrorText>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              variant="secondary"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <dl className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
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

      <div className="border-t border-slate-800 pt-4">
        <Button variant="danger" size="sm" onClick={onDeleteAccount}>
          Excluir conta
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right text-slate-100">{value && value.trim() ? value : "—"}</dd>
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
