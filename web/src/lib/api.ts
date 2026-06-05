export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type Role = "Student" | "Teacher";
export type ExerciseKind = "MultipleChoice" | "Numeric" | "OpenText";

export interface User {
  urId: number;
  urEmail: string;
  urName: string;
  urRole: Role;
}

export interface ApiModule {
  mrsId: number;
  mrsTitle: string;
  mrsSlug: string;
  mrsDescription: string;
  mrsOrderIdx: number;
  mrsPrerequisiteId: number | null;
}

export interface ModuleInput {
  mrqTitle: string;
  mrqSlug: string;
  mrqDescription: string;
  mrqOrderIdx: number;
  mrqPrerequisiteId: number | null;
}

export interface ApiLesson {
  lrsId: number;
  lrsModuleId: number;
  lrsTitle: string;
  lrsContent: string;
  lrsOrderIdx: number;
}

export interface LessonInput {
  lrqModuleId: number;
  lrqTitle: string;
  lrqContent: string;
  lrqOrderIdx: number;
}

export interface ApiExercise {
  ersId: number;
  ersLessonId: number;
  ersKind: ExerciseKind;
  ersPrompt: string;
  ersPayload: unknown;
  ersOrderIdx: number;
  // Preenchidos apenas para professor (consulta/edição); null para aluno.
  ersAnswer?: unknown;
  ersExplanation?: string | null;
}

export interface ExerciseInput {
  erqLessonId: number;
  erqKind: ExerciseKind;
  erqPrompt: string;
  erqPayload: unknown;
  erqAnswer: unknown;
  erqExplanation: string;
  erqOrderIdx: number;
}

export interface SubmitResult {
  sersCorrect: boolean;
  sersExplanation: string;
}

export interface ExerciseResponseEntry {
  rseExerciseId: number;
  rseAnswer: unknown;
  rseCorrect: boolean;
}

export interface ProgressEntry {
  peLessonId: number;
  peCompleted: boolean;
  peCompletedAt: string;
}

export interface RoadmapItem {
  riModuleId: number;
  riTitle: string;
  riSlug: string;
  riDescription: string;
  riOrderIdx: number;
  riPrerequisiteId: number | null;
  riUnlocked: boolean;
  riCompletedLessons: number;
  riTotalLessons: number;
}

export interface ProfileData {
  prId: number;
  prEmail: string;
  prName: string;
  prRole: Role;
  prCourse: string | null;
  prEnrollment: string | null;
  prSemester: string | null;
  prShift: string | null;
  prDiscipline: string | null;
}

export interface ProfileInput {
  puName: string;
  puCourse: string | null;
  puEnrollment: string | null;
  puSemester: string | null;
  puShift: string | null;
  puDiscipline: string | null;
}

export interface DashboardModuleStat {
  dmsModuleId: number;
  dmsTitle: string;
  dmsCompletionRate: number;
  dmsAccuracyRate: number;
  dmsAttempts: number;
}

export interface DashboardActivity {
  dacUserName: string;
  dacPrompt: string;
  dacCorrect: boolean;
  dacAt: string;
}

export interface DashboardStudent {
  dstName: string;
  dstEmail: string;
  dstCreatedAt: string;
}

export interface DashboardData {
  dbTotalStudents: number;
  dbTotalModules: number;
  dbTotalLessons: number;
  dbTotalExercises: number;
  dbAvgProgress: number;
  dbAccuracyRate: number;
  dbTotalAttempts: number;
  dbActiveStudents: number;
  dbLowProgressStudents: number;
  dbModules: DashboardModuleStat[];
  dbRecentActivity: DashboardActivity[];
  dbNewStudents: DashboardStudent[];
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const user = loadUser();
  return user ? { "X-User-Id": String(user.urId) } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  // Auth
  register: (input: {
    rrEmail: string;
    rrPassword: string;
    rrName: string;
    rrRole: Role;
    rrCourse?: string | null;
    rrEnrollment?: string | null;
    rrSemester?: string | null;
    rrShift?: string | null;
    rrDiscipline?: string | null;
  }) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (input: { lrEmail: string; lrPassword: string }) =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // Modules
  listModules: () => request<ApiModule[]>("/modules"),
  getModule: (id: number) => request<ApiModule>(`/modules/${id}`),
  createModule: (input: ModuleInput) =>
    request<ApiModule>("/modules", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateModule: (id: number, input: ModuleInput) =>
    request<ApiModule>(`/modules/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteModule: (id: number) =>
    request<void>(`/modules/${id}`, { method: "DELETE" }),
  listLessonsOfModule: (moduleId: number) =>
    request<ApiLesson[]>(`/modules/${moduleId}/lessons`),

  // Lessons
  getLesson: (id: number) => request<ApiLesson>(`/lessons/${id}`),
  createLesson: (input: LessonInput) =>
    request<ApiLesson>("/lessons", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateLesson: (id: number, input: LessonInput) =>
    request<ApiLesson>(`/lessons/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteLesson: (id: number) =>
    request<void>(`/lessons/${id}`, { method: "DELETE" }),
  listExercisesOfLesson: (lessonId: number) =>
    request<ApiExercise[]>(`/lessons/${lessonId}/exercises`),
  listResponsesOfLesson: (lessonId: number) =>
    request<ExerciseResponseEntry[]>(`/lessons/${lessonId}/responses`),

  // Exercises
  getExercise: (id: number) => request<ApiExercise>(`/exercises/${id}`),
  createExercise: (input: ExerciseInput) =>
    request<ApiExercise>("/exercises", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateExercise: (id: number, input: ExerciseInput) =>
    request<ApiExercise>(`/exercises/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteExercise: (id: number) =>
    request<void>(`/exercises/${id}`, { method: "DELETE" }),
  submitExercise: (id: number, answer: unknown) =>
    request<SubmitResult>(`/exercises/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ serAnswer: answer }),
    }),

  // Progress
  listProgress: () => request<ProgressEntry[]>("/progress"),
  markLessonCompleted: (lessonId: number) =>
    request<void>("/progress/complete", {
      method: "POST",
      body: JSON.stringify({ clrLessonId: lessonId }),
    }),
  unmarkLesson: (lessonId: number) =>
    request<void>(`/progress/lesson/${lessonId}`, { method: "DELETE" }),

  // Roadmap
  getRoadmap: () => request<RoadmapItem[]>("/roadmap"),

  // Dashboard (professor)
  getDashboard: () => request<DashboardData>("/dashboard"),

  // Profile
  getProfile: () => request<ProfileData>("/profile"),
  updateProfile: (input: ProfileInput) =>
    request<ProfileData>("/profile", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteProfile: () => request<void>("/profile", { method: "DELETE" }),
};

export function saveUser(user: User) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("user", JSON.stringify(user));
    // Notifica a aba atual (o evento "storage" só dispara em outras abas).
    window.dispatchEvent(new Event("auth-change"));
  }
}

export function loadUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearUser() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
  }
}

/** Home padrão de cada perfil. */
export function homeFor(role: Role): string {
  return role === "Teacher" ? "/dashboard" : "/roadmap";
}
