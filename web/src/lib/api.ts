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

export interface DiagnosticQuestion {
  dqId: number;
  dqTopic: string;
  dqPrompt: string;
  dqOptions: string[];
}

export interface DiagnosticAnswer {
  daQuestionId: number;
  daSelectedIdx: number;
}

export interface DiagnosticResult {
  drStrengths: string[];
  drWeaknesses: string[];
  drRecommendedSlugs: string[];
  drCreatedAt: string;
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
  listLessonsOfModule: (moduleId: number) =>
    request<ApiLesson[]>(`/modules/${moduleId}/lessons`),

  // Lessons
  getLesson: (id: number) => request<ApiLesson>(`/lessons/${id}`),
  createLesson: (input: LessonInput) =>
    request<ApiLesson>("/lessons", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  listExercisesOfLesson: (lessonId: number) =>
    request<ApiExercise[]>(`/lessons/${lessonId}/exercises`),

  // Exercises
  createExercise: (input: ExerciseInput) =>
    request<ApiExercise>("/exercises", {
      method: "POST",
      body: JSON.stringify(input),
    }),
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

  // Diagnostic
  getDiagnosticQuestions: () =>
    request<DiagnosticQuestion[]>("/diagnostic/questions"),
  submitDiagnostic: (answers: DiagnosticAnswer[]) =>
    request<DiagnosticResult>("/diagnostic/submit", {
      method: "POST",
      body: JSON.stringify({ dsAnswers: answers }),
    }),
  getDiagnosticResult: () =>
    request<DiagnosticResult>("/diagnostic/result"),
};

export function saveUser(user: User) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("user", JSON.stringify(user));
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
  }
}
