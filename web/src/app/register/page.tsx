"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, homeFor, type Role, saveUser } from "@/lib/api";
import { Button, ErrorText, Field, Input, PageHeader, Select } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Student");
  const [course, setCourse] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [semester, setSemester] = useState("");
  const [shift, setShift] = useState("");
  const [discipline, setDiscipline] = useState("");
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
        rrCourse: role === "Student" ? course.trim() || null : null,
        rrEnrollment: role === "Student" ? enrollment.trim() || null : null,
        rrSemester: role === "Student" ? semester.trim() || null : null,
        rrShift: role === "Student" ? shift.trim() || null : null,
        rrDiscipline: role === "Teacher" ? discipline.trim() || null : null,
      });
      saveUser(user);
      router.push(homeFor(user.urRole));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <PageHeader title="Criar conta" />
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Nome">
          <Input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Senha" hint="Mínimo de 6 caracteres.">
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Perfil">
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="Student">Aluno</option>
            <option value="Teacher">Professor</option>
          </Select>
        </Field>

        {role === "Teacher" ? (
          <Field label="Disciplina">
            <Input
              type="text"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
            />
          </Field>
        ) : (
          <>
            <Field label="Curso">
              <Input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />
            </Field>
            <Field label="Matrícula">
              <Input
                type="text"
                value={enrollment}
                onChange={(e) => setEnrollment(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Semestre">
                <Input
                  type="text"
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
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Criando..." : "Criar conta"}
        </Button>
      </form>
    </div>
  );
}
