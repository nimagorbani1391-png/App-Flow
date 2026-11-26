export type ElementKind = "text" | "button" | "input" | "card" | "heading" | "image" | "divider" | "badge" | "checkbox" | "spacer";
export type TextAlignment = "right" | "center" | "left";

export type VisualElement = {
  id: string;
  type: ElementKind;
  text: string;
  color: string;
  background: string;
  fontSize: number;
  padding: number;
  margin: number;
  radius: number;
  align: TextAlignment;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
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
const LEGACY_KEY = "appflow-projects";

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

function isElement(value: unknown): value is VisualElement {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<VisualElement>;
  return typeof item.id === "string"
    && ["text", "button", "input", "card", "heading", "image", "divider", "badge", "checkbox", "spacer"].includes(item.type ?? "")
    && typeof item.text === "string"
    && typeof item.color === "string"
    && typeof item.background === "string"
    && typeof item.fontSize === "number"
    && typeof item.padding === "number"
    && typeof item.radius === "number"
    && ["right", "center", "left"].includes(item.align ?? "");
}

export function isValidProject(value: unknown): value is AppProject {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<AppProject>;
  return typeof project.id === "string"
    && typeof project.name === "string"
    && Array.isArray(project.elements)
    && typeof project.createdAt === "string"
    && typeof project.updatedAt === "string"
    && project.elements.every(isElement);
}

function migrateLegacyProjects(): AppProject[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const migrated: AppProject[] = [];
    for (const [index, rawProject] of parsed.entries()) {
      if (!rawProject || typeof rawProject !== "object") continue;
      const old = rawProject as { id?: unknown; name?: unknown; elements?: unknown; createdAt?: unknown; updatedAt?: unknown };
      if (!Array.isArray(old.elements)) continue;
      const now = new Date().toISOString();
      const elements: VisualElement[] = old.elements.flatMap((rawElement, elementIndex) => {
        if (!rawElement || typeof rawElement !== "object") return [];
        const oldElement = rawElement as { id?: unknown; type?: unknown; text?: unknown };
        const oldType = String(oldElement.type ?? "").toLowerCase();
        const type: ElementKind = oldType.includes("button") ? "button"
          : oldType.includes("edit") || oldType.includes("input") ? "input"
          : oldType.includes("card") ? "card" : "text";
        return [{
          id: typeof oldElement.id === "string" ? oldElement.id : `migrated-${index}-${elementIndex}`,
          type,
          text: typeof oldElement.text === "string" ? oldElement.text : "عنصر بازیابی‌شده",
          color: "#292930",
          background: type === "button" ? "#ff0000" : "#ffffff",
          fontSize: 14,
          padding: 12,
          margin: 7,
          radius: 10,
          align: "right"
        }];
      });
      migrated.push({
        id: typeof old.id === "string" && old.id !== "current" ? old.id : `migrated-project-${index}-${Date.now()}`,
        name: typeof old.name === "string" && old.name.trim() ? old.name : "پروژه بازیابی‌شده",
        elements,
        createdAt: typeof old.createdAt === "string" ? old.createdAt : now,
        updatedAt: typeof old.updatedAt === "string" ? old.updatedAt : now
      });
    }
    return migrated;
  } catch {
    return [];
  }
}

function readFallback(): AppProject[] {
  try {
    const value = localStorage.getItem(FALLBACK_KEY);
    if (value) {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.every(isValidProject)) return parsed;
    }
  } catch {
    // Continue with the legacy migration below.
  }
  const migrated = migrateLegacyProjects();
  if (migrated.length) {
    try { localStorage.setItem(FALLBACK_KEY, JSON.stringify(migrated)); } catch { /* IndexedDB remains the primary store. */ }
  }
  return migrated;
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

function sortProjects(projects: AppProject[]): AppProject[] {
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listProjects(): Promise<AppProject[]> {
  try {
    const database = await openDatabase();
    const records = await requestResult(database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll()) as AppProject[];
    database.close();
    const validRecords = records.filter(isValidProject);
    if (validRecords.length > 0) return sortProjects(validRecords);

    // Import older localStorage projects once, only when IndexedDB is empty.
    const fallbackProjects = readFallback();
    if (fallbackProjects.length === 0) return [];
    const writeDb = await openDatabase();
    const transaction = writeDb.transaction(STORE_NAME, "readwrite");
    for (const project of fallbackProjects) transaction.objectStore(STORE_NAME).put(project);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("بازیابی اطلاعات ناموفق بود."));
    });
    writeDb.close();
    return sortProjects(fallbackProjects);
  } catch {
    return sortProjects(readFallback());
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
    try {
      const projects = readFallback().filter(item => item.id !== project.id);
      writeFallback([project, ...projects]);
    } catch { /* IndexedDB save has succeeded. */ }
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
  let databaseError: unknown = null;
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
  } catch (error) {
    databaseError = error;
  }
  try {
    writeFallback(readFallback().filter(item => item.id !== projectId));
  } catch (error) {
    if (databaseError) throw error;
  }
  if (databaseError && readFallback().some(item => item.id === projectId)) {
    throw databaseError instanceof Error ? databaseError : new Error("حذف پروژه ناموفق بود.");
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
    card: "عنوان کارت",
    heading: "عنوان اصلی",
    image: "نشانی تصویر",
    divider: "",
    badge: "برچسب",
    checkbox: "گزینه جدید",
    spacer: ""
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
    margin: 7,
    radius: 10,
    align: "right",
    x: 5,
    y: 5 + Math.min(20, Math.random() * 4),
    width: type === "divider" ? 90 : type === "badge" ? 36 : 90,
    height: type === "heading" ? 12 : type === "divider" ? 1 : type === "spacer" ? 8 : type === "image" ? 32 : type === "checkbox" ? 10 : 12
  };
}

export function parseProjectBackup(json: string): AppProject[] {
  const data: unknown = JSON.parse(json);
  const projects = Array.isArray(data) ? data : [data];
  if (!projects.every(isValidProject)) {
    throw new Error("ساختار فایل پشتیبان معتبر نیست.");
  }
  return projects;
}
