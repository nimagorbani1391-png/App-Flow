export type ElementKind = "text" | "button" | "input" | "card";
export type TextAlignment = "right" | "center" | "left";

export type VisualElement = {
  id: string;
  type: ElementKind;
  text: string;
  color: string;
  background: string;
  fontSize: number;
  padding: number;
  radius: number;
  align: TextAlignment;
};

export type AppProject = {
  id: string;
  name: string;
  elements: VisualElement[];
  createdAt: string;
  updatedAt: string;
};

const DATABASE_NAME = "app-flow-database";
const DATABASE_VERSION = 1;
const STORE_NAME = "projects";
const FALLBACK_KEY = "appflow-projects-v2";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("مرورگر از IndexedDB پشتیبانی نمی‌کند."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("بازکردن پایگاه داده محلی ناموفق بود."));
    request.onblocked = () => reject(new Error("پایگاه داده محلی توسط برگه دیگری مسدود شده است."));
  });
}

function readFallback(): AppProject[] {
  try {
    const value = localStorage.getItem(FALLBACK_KEY);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as AppProject[] : [];
  } catch {
    return [];
  }
}

function writeFallback(projects: AppProject[]): void {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(projects));
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("عملیات پایگاه داده ناموفق بود."));
  });
}

export async function listProjects(): Promise<AppProject[]> {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readonly");
    const records = await requestResult(transaction.objectStore(STORE_NAME).getAll());
    database.close();
    return (records as AppProject[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return readFallback().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export async function saveProject(project: AppProject): Promise<void> {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(project);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("ذخیره پروژه ناموفق بود."));
      transaction.onabort = () => reject(transaction.error ?? new Error("ذخیره پروژه لغو شد."));
    });
    database.close();
  } catch (databaseError) {
    try {
      const projects = readFallback().filter(item => item.id !== project.id);
      writeFallback([project, ...projects]);
    } catch {
      throw databaseError instanceof Error ? databaseError : new Error("فضای ذخیره‌سازی در دسترس نیست.");
    }
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(projectId);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("حذف پروژه ناموفق بود."));
      transaction.onabort = () => reject(transaction.error ?? new Error("حذف پروژه لغو شد."));
    });
    database.close();
  } catch {
    writeFallback(readFallback().filter(item => item.id !== projectId));
  }
}

export function createProject(name = "پروژه جدید"): AppProject {
  const now = new Date().toISOString();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `project-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return { id, name, elements: [], createdAt: now, updatedAt: now };
}

export function createElement(type: ElementKind): VisualElement {
  const defaults: Record<ElementKind, string> = {
    text: "متن جدید",
    button: "دکمه جدید",
    input: "متن ورودی",
    card: "عنوان کارت"
  };
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `element-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    text: defaults[type],
    color: "#292930",
    background: type === "button" ? "#ff0000" : "#ffffff",
    fontSize: type === "text" ? 16 : 14,
    padding: 12,
    radius: 10,
    align: "right"
  };
}

export function isValidProject(value: unknown): value is AppProject {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<AppProject>;
  return typeof project.id === "string"
    && typeof project.name === "string"
    && Array.isArray(project.elements)
    && typeof project.createdAt === "string"
    && typeof project.updatedAt === "string"
    && project.elements.every(element => {
      if (!element || typeof element !== "object") return false;
      const item = element as Partial<VisualElement>;
      return typeof item.id === "string"
        && ["text", "button", "input", "card"].includes(item.type ?? "")
        && typeof item.text === "string"
        && typeof item.color === "string"
        && typeof item.background === "string"
        && typeof item.fontSize === "number"
        && typeof item.padding === "number"
        && typeof item.radius === "number"
        && ["right", "center", "left"].includes(item.align ?? "");
    });
}

export function parseProjectBackup(json: string): AppProject[] {
  const data: unknown = JSON.parse(json);
  const projects = Array.isArray(data) ? data : [data];
  if (!projects.every(isValidProject)) {
    throw new Error("ساختار فایل پشتیبان معتبر نیست.");
  }
  return projects;
}
