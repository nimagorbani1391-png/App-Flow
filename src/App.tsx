import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowLeft, ArrowUp, ChevronDown, Copy, Download, FileUp,
  FolderKanban, FolderOpen, GraduationCap, Layers, Menu, MousePointer2, Plus,
  Save, Settings2, Smartphone, Tablet, Monitor, Trash2, Type, X, FormInput,
  Square, Undo2, Redo2, Search, Palette, Image as ImageIcon, Minus, Tag, CheckSquare, Heading, Move, Maximize2
} from "lucide-react";
import {
  AppProject, ElementKind, VisualElement, createElement, createProject,
  deleteProject as removeStoredProject, listProjects,
  parseProjectBackup, saveProject as persistProject
} from "./lib/projectStore";

type ConfirmState = { id: string; name: string } | null;

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [activeProject, setActiveProject] = useState<AppProject | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [dragPreview, setDragPreview] = useState<{id:string;x:number;y:number;width:number;height:number}|null>(null);
  const dragStartRef = useRef<{id:string;pointerX:number;pointerY:number;x:number;y:number;width:number;height:number;mode:"move"|"resize"}|null>(null);
  const [search, setSearch] = useState("");
  const [savedState, setSavedState] = useState<"loading" | "saving" | "saved" | "error">("loading");
  const [history, setHistory] = useState<AppProject[]>([]);
  const [future, setFuture] = useState<AppProject[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState>(null);
  const [toast, setToast] = useState("");
  const [statusTime, setStatusTime] = useState(() => new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  const refreshProjects = useCallback(async () => {
    const records = await listProjects();
    setProjects(records);
    setSavedState("saved");
  }, []);

  useEffect(() => {
    let alive = true;
    listProjects().then(records => {
      if (!alive) return;
      setProjects(records);
      setSavedState("saved");
    }).catch(() => {
      if (alive) setSavedState("error");
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!activeProject) return;
    setSavedState("saving");
    const timer = window.setTimeout(() => {
      persistProject(activeProject).then(() => {
        setProjects(current => [activeProject, ...current.filter(project => project.id !== activeProject.id)]
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
        setSavedState("saved");
      }).catch(() => setSavedState("error"));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [activeProject]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!editorOpen || !(event.ctrlKey || event.metaKey)) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey)) {
        event.preventDefault();
        redo();
      } else if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveActiveProject();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    const updateTime = () => setStatusTime(new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }));
    const timer = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 3000);
  };

  const closeEditorSafely = async () => {
    if (!activeProject) {
      setEditorOpen(false);
      return;
    }
    try {
      const latest = { ...activeProject, updatedAt: new Date().toISOString() };
      await persistProject(latest);
      setProjects(current => [latest, ...current.filter(project => project.id !== latest.id)]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setActiveProject(null);
      setSelectedId(null);
      setEditorOpen(false);
    } catch {
      setSavedState("error");
      showToast("ذخیره پروژه ناموفق بود؛ از صفحه خارج نشو تا اطلاعات از دست نرود.");
    }
  };

  const beginNewProject = () => {
    const project = createProject();
    setActiveProject(project);
    setSelectedId(null);
    setHistory([]);
    setFuture([]);
    setAddMenuOpen(false);
    setEditorOpen(true);
  };

  const openProject = (project: AppProject) => {
    setActiveProject({ ...project, elements: project.elements.map(element => ({ ...element })) });
    setSelectedId(null);
    setHistory([]);
    setFuture([]);
    setEditorOpen(true);
  };

  const mutateProject = (updater: (project: AppProject) => AppProject) => {
    if (!activeProject) return;
    setHistory(current => [...current.slice(-39), activeProject]);
    setFuture([]);
    setActiveProject(current => current ? {
      ...updater(current),
      updatedAt: new Date().toISOString()
    } : current);
  };

  const updateElement = (id: string, changes: Partial<VisualElement>) => {
    mutateProject(project => ({
      ...project,
      elements: project.elements.map(element => element.id === id ? { ...element, ...changes } : element)
    }));
  };

  const addElement = (type: ElementKind) => {
    if (!activeProject) return;
    const element = createElement(type);
    const index = activeProject.elements.length;
    element.x = 5 + (index % 3) * 3;
    element.y = 5 + Math.min(index * 13, 75);
    mutateProject(project => ({ ...project, elements: [...project.elements, element] }));
    setSelectedId(element.id);
    setAddMenuOpen(false);
  };

  const startElementGesture = (event: React.PointerEvent<HTMLElement>, element: VisualElement, mode: "move"|"resize") => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(element.id);
    const canvas = event.currentTarget.closest('.preview-content') as HTMLElement | null;
    const elementNode = event.currentTarget.closest('[data-element-id]') as HTMLElement | null;
    if (!canvas || !elementNode) return;
    const rect = canvas.getBoundingClientRect();
    dragStartRef.current = { id:element.id, pointerX:event.clientX, pointerY:event.clientY, x:element.x??5, y:element.y??5, width:element.width??90, height:element.height??12, mode };
    event.currentTarget.setPointerCapture(event.pointerId);
    elementNode.dataset.canvasWidth = String(rect.width);
    elementNode.dataset.canvasHeight = String(rect.height);
    setDragPreview({id:element.id,x:element.x??5,y:element.y??5,width:element.width??90,height:element.height??12});
  };

  const moveElementGesture = (event: React.PointerEvent<HTMLElement>) => {
    const start = dragStartRef.current;
    if (!start || start.id !== event.currentTarget.dataset.elementId) return;
    const width = Number(event.currentTarget.dataset.canvasWidth || 1);
    const height = Number(event.currentTarget.dataset.canvasHeight || 1);
    const dx = (event.clientX-start.pointerX)/width*100;
    const dy = (event.clientY-start.pointerY)/height*100;
    const next = start.mode === "move"
      ? {x:Math.max(0,Math.min(100-start.width,start.x+dx)),y:Math.max(0,Math.min(100-start.height,start.y+dy)),width:start.width,height:start.height}
      : {x:start.x,y:start.y,width:Math.max(8,Math.min(100-start.x,start.width+dx)),height:Math.max(4,Math.min(100-start.y,start.height+dy))};
    setDragPreview({id:start.id,...next});
  };

  const finishElementGesture = () => {
    const start = dragStartRef.current;
    const next = dragPreview;
    if (!start || !next || start.id !== next.id) return;
    mutateProject(project=>({...project,elements:project.elements.map(item=>item.id===start.id?{...item,x:next.x,y:next.y,width:next.width,height:next.height}:item)}));
    dragStartRef.current = null;
    setDragPreview(null);
  };

  const chooseImage = (file?: File) => {
    if (!file || !selectedElement || selectedElement.type !== "image") return;
    if (!file.type.startsWith("image/")) { showToast("لطفاً یک فایل تصویری انتخاب کن."); return; }
    if (file.size > 8 * 1024 * 1024) { showToast("حجم تصویر باید کمتر از ۸ مگابایت باشد."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") updateElement(selectedElement.id, { text: reader.result });
    };
    reader.onerror = () => showToast("خواندن تصویر ناموفق بود.");
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const deleteSelectedElement = () => {
    if (!selectedId) return;
    mutateProject(project => ({ ...project, elements: project.elements.filter(element => element.id !== selectedId) }));
    setSelectedId(null);
    showToast("عنصر حذف شد.");
  };

  const moveElement = (id: string, offset: number) => {
    mutateProject(project => {
      const currentIndex = project.elements.findIndex(element => element.id === id);
      const nextIndex = currentIndex + offset;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= project.elements.length) return project;
      const elements = [...project.elements];
      [elements[currentIndex], elements[nextIndex]] = [elements[nextIndex], elements[currentIndex]];
      return { ...project, elements };
    });
  };

  const undo = () => {
    if (!activeProject || history.length === 0) return;
    setFuture(current => [...current, activeProject]);
    setActiveProject(history[history.length - 1]);
    setHistory(current => current.slice(0, -1));
  };

  const redo = () => {
    if (!activeProject || future.length === 0) return;
    setHistory(current => [...current, activeProject]);
    setActiveProject(future[future.length - 1]);
    setFuture(current => current.slice(0, -1));
  };

  const saveActiveProject = async () => {
    if (!activeProject) return;
    try {
      const ready = { ...activeProject, updatedAt: new Date().toISOString() };
      await persistProject(ready);
      setActiveProject(ready);
      setProjects(current => [ready, ...current.filter(project => project.id !== ready.id)]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setSavedState("saved");
      showToast("پروژه با موفقیت ذخیره شد.");
    } catch {
      setSavedState("error");
      showToast("ذخیره‌سازی ناموفق بود. فضای دستگاه را بررسی کنید.");
    }
  };

  const duplicateProject = async (project: AppProject) => {
    const copy: AppProject = {
      ...project,
      id: createProject().id,
      name: `${project.name} - نسخه کپی`,
      elements: project.elements.map(element => ({ ...element, id: createElement(element.type).id })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      await persistProject(copy);
      await refreshProjects();
      showToast("یک نسخه از پروژه ساخته شد.");
    } catch {
      showToast("ساخت نسخه کپی ناموفق بود.");
    }
  };

  const confirmProjectDelete = async () => {
    if (!confirmDelete) return;
    try {
      await removeStoredProject(confirmDelete.id);
      setProjects(current => current.filter(project => project.id !== confirmDelete.id));
      if (activeProject?.id === confirmDelete.id) {
        setActiveProject(null);
        setEditorOpen(false);
      }
      setConfirmDelete(null);
      showToast("پروژه حذف شد.");
    } catch {
      showToast("حذف پروژه ناموفق بود.");
    }
  };

  const exportBackup = () => {
    const data = JSON.stringify(projects, null, 2);
    const file = new Blob([data], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "app-flow-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    showToast("فایل پشتیبان آماده شد.");
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const projectsToImport = parseProjectBackup(await file.text());
      for (const project of projectsToImport) {
        const imported: AppProject = {
          ...project,
          id: createProject().id,
          name: project.name || "پروژه بازیابی‌شده",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await persistProject(imported);
      }
      await refreshProjects();
      showToast(`${projectsToImport.length} پروژه بازیابی شد.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "فایل پشتیبان قابل بازیابی نیست.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredProjects = useMemo(() => projects.filter(project =>
    project.name.toLocaleLowerCase("fa").includes(search.toLocaleLowerCase("fa"))
  ), [projects, search]);

  const selectedElement = activeProject?.elements.find(element => element.id === selectedId) ?? null;

  const onDropElement = (targetId: string) => {
    if (!activeProject || !selectedId || selectedId === targetId) return;
    mutateProject(project => {
      const from = project.elements.findIndex(element => element.id === selectedId);
      const to = project.elements.findIndex(element => element.id === targetId);
      if (from < 0 || to < 0) return project;
      const elements = [...project.elements];
      const [moved] = elements.splice(from, 1);
      elements.splice(to, 0, moved);
      return { ...project, elements };
    });
  };

  return (
    <main className="app-shell" dir="rtl">
      {!editorOpen ? <>
        <header className="brand-header">
          <button className="menu-toggle" type="button" aria-label={menuOpen ? "بستن منو" : "باز کردن منو"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={23} /> : <Menu size={24} />}
          </button>
          <h1 className="brand-title">اپ فلو</h1>
          <button className={`menu-backdrop ${menuOpen ? "visible" : ""}`} aria-label="بستن منو" aria-hidden={!menuOpen} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} />
          <nav className={`hamburger-menu ${menuOpen ? "open" : ""}`} aria-label="منوی اصلی" aria-hidden={!menuOpen}>
            <button className="menu-item active" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}><FolderKanban size={19} /><span>پروژه‌ها</span></button>
            <button className="menu-item" tabIndex={menuOpen ? 0 : -1} onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}><Settings2 size={19} /><span>تنظیمات</span></button>
            <a className="menu-item" href="https://rubika.ir/App_Flow" target="_blank" rel="noopener noreferrer" tabIndex={menuOpen ? 0 : -1}><GraduationCap size={19} /><span>آموزش‌ها</span></a>
          </nav>
        </header>
        <div className="app-layout">
          <section className="workspace">
            <div className="page-heading">
              <div><h2>پروژه‌های من</h2><p>پروژه‌هایت را اینجا مدیریت کن.</p></div>
              <span className="project-count"><FolderKanban size={17} /> {projects.length.toLocaleString("fa")} پروژه</span>
            </div>
            <button className="create-card" type="button" onClick={beginNewProject}>
              <span className="create-icon"><Plus size={23} strokeWidth={2.2} /></span>
              <span className="create-copy"><strong>ساخت اپلیکیشن جدید</strong><span>طراحی بصری اپ اندرویدی خودت را شروع کن</span></span>
              <span className="create-card-arrow"><ArrowLeft size={20} /></span>
            </button>
            <div className="platform-notice">
              <span className="platform-pulse" />
              <div><strong>APP FLOW · نسخه MVP</strong><span>فعلاً طراحی و مدیریت پروژه؛ خروجی APK و AAB در مرحله بعدی اضافه می‌شود.</span></div>
              <span className="platform-tag">ANDROID</span>
            </div>
            <section className="projects-list" aria-label="لیست پروژه‌ها">
              <div className="projects-list-heading">
                <div className="projects-list-title"><FolderKanban size={19} /><h3>لیست پروژه‌ها</h3></div>
                <span className="projects-list-total">{projects.length.toLocaleString("fa")} پروژه</span>
              </div>
              {projects.length === 0 ? <div className="projects-list-empty"><FolderOpen size={25} strokeWidth={1.7} /><span>هنوز پروژه‌ای ایجاد نشده است.</span><small>پروژه‌های ساخته‌شده در همین دستگاه نگهداری می‌شوند.</small></div> : <>
                <div className="project-list-toolbar">
                  <div className="project-search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="جست‌وجوی پروژه‌ها..." aria-label="جست‌وجوی پروژه‌ها" /></div>
                  <button className="backup-button" onClick={exportBackup}><Download size={16} /> پشتیبان‌گیری</button>
                </div>
                <div className="project-grid">
                  {filteredProjects.map(project => <article className="project-card" key={project.id}>
                    <div className="project-card-icon"><FolderKanban size={22} /></div>
                    <div className="project-card-main"><strong>{project.name}</strong><span>{project.elements.length.toLocaleString("fa")} عنصر · آخرین تغییر {new Date(project.updatedAt).toLocaleDateString("fa-IR")}</span></div>
                    <div className="project-card-actions">
                      <button aria-label="بازکردن پروژه" title="بازکردن پروژه" onClick={() => openProject(project)}>بازکردن</button>
                      <button aria-label="ساخت نسخه کپی" title="ساخت نسخه کپی" onClick={() => void duplicateProject(project)}><Copy size={16} /></button>
                      <button aria-label="حذف پروژه" title="حذف پروژه" onClick={() => setConfirmDelete({ id: project.id, name: project.name })}><Trash2 size={16} /></button>
                    </div>
                  </article>)}
                </div>
                {filteredProjects.length === 0 && <div className="projects-list-empty compact">پروژه‌ای با این نام پیدا نشد.</div>}
              </>}
            </section>
          </section>
        </div>
      </> : activeProject && <section className="builder-shell">
        <header className="builder-header">
          <button className="builder-back" onClick={() => void closeEditorSafely()} aria-label="بازگشت به پروژه‌ها"><ArrowLeft size={21} /></button>
          <div className="builder-name-wrap">
            <input value={activeProject.name} aria-label="نام پروژه" onChange={event => mutateProject(project => ({ ...project, name: event.target.value }))} />
            <span>{activeProject.elements.length.toLocaleString("fa")} عنصر</span>
          </div>
          <div className="builder-history">
            <button onClick={undo} disabled={history.length === 0} title="واگرد" aria-label="واگرد"><Undo2 size={19} /></button>
            <button onClick={redo} disabled={future.length === 0} title="از نو" aria-label="از نو"><Redo2 size={19} /></button>
          </div>
          <span className={`save-indicator ${savedState}`}>{savedState === "saving" ? "در حال ذخیره" : savedState === "error" ? "ذخیره ناموفق" : "ذخیره شد"}</span>
          <button className="builder-save" onClick={() => void saveActiveProject()}><Save size={17} /><span>ذخیره</span></button>
        </header>

        <div className="builder-tabs"><span className="active">طراحی صفحه</span><span>پیش‌نمایش زنده</span></div>

        <div className="builder-workspace">
          <aside className="builder-panel builder-layers">
            <div className="builder-panel-title"><span><Layers size={17} /> ابزارها و لایه‌ها</span></div>
            <div className="builder-add-title">افزودن عنصر</div>
            <div className="builder-add-grid">
              <button onClick={() => addElement("text")}><Type size={18} /><span>متن</span></button>
              <button onClick={() => addElement("button")}><MousePointer2 size={18} /><span>دکمه</span></button>
              <button onClick={() => addElement("input")}><FormInput size={18} /><span>کادر ورودی</span></button>
              <button onClick={() => addElement("card")}><Square size={18} /><span>کارت</span></button>
              <button onClick={() => addElement("heading")}><Heading size={18} /><span>عنوان</span></button>
              <button onClick={() => addElement("image")}><ImageIcon size={18} /><span>تصویر</span></button>
              <button onClick={() => addElement("divider")}><Minus size={18} /><span>خط جداکننده</span></button>
              <button onClick={() => addElement("badge")}><Tag size={18} /><span>برچسب</span></button>
              <button onClick={() => addElement("checkbox")}><CheckSquare size={18} /><span>چک‌باکس</span></button>
              <button onClick={() => addElement("spacer")}><Move size={18} /><span>فاصله‌گذار</span></button>
            </div>
            <div className="builder-layers-heading"><span>لایه‌های صفحه</span><small>{activeProject.elements.length.toLocaleString("fa")}</small></div>
            {activeProject.elements.length === 0 ? <div className="builder-muted">هنوز عنصری اضافه نشده است.</div> :
              activeProject.elements.map((element, index) => <div key={element.id} className={`layer-row ${selectedId === element.id ? "selected" : ""}`} draggable onDragStart={() => setSelectedId(element.id)} onDragOver={event => event.preventDefault()} onDrop={() => onDropElement(element.id)}>
                <button className="layer-select" onClick={() => setSelectedId(element.id)}>
                  <span className="layer-number">{(index + 1).toLocaleString("fa")}</span>
                  <span>{element.type === "text" ? "متن" : element.type === "button" ? "دکمه" : element.type === "input" ? "کادر ورودی" : "کارت"}</span>
                </button>
                <span className="layer-actions">
                  <button title="انتقال به بالا" aria-label="انتقال به بالا" disabled={index === 0} onClick={() => moveElement(element.id, -1)}><ArrowUp size={14} /></button>
                  <button title="انتقال به پایین" aria-label="انتقال به پایین" disabled={index === activeProject.elements.length - 1} onClick={() => moveElement(element.id, 1)}><ArrowDown size={14} /></button>
                </span>
              </div>)}
            <div className="builder-panel-note">برای تغییر ترتیب، لایه‌ها را بکش یا از فلش‌ها استفاده کن.</div>
          </aside>

          <section className="builder-canvas-wrap">
            <div className="canvas-toolbar">
              <span><Smartphone size={17} /> پیش‌نمایش زنده</span>
              <div className="preview-mode-switch" role="group" aria-label="اندازه پیش‌نمایش">
                <button className={previewMode === "mobile" ? "active" : ""} onClick={() => setPreviewMode("mobile")}><Smartphone size={14} /> موبایل</button>
                <button className={previewMode === "tablet" ? "active" : ""} onClick={() => setPreviewMode("tablet")}><Tablet size={14} /> تبلت</button>
                <button className={previewMode === "desktop" ? "active" : ""} onClick={() => setPreviewMode("desktop")}><Monitor size={14} /> دسکتاپ</button>
              </div>
            </div>
            <div className="builder-canvas">
              <div className={`preview-device preview-device-${previewMode}`}>
                <div className="preview-status"><span>{statusTime}</span><span>● ● ●</span></div>
                <div className="preview-app-title">{activeProject.name || "پروژه جدید"}</div>
                <div className="preview-content">
                  {activeProject.elements.length === 0 ? <div className="preview-empty"><Plus size={28} /><strong>صفحه شما خالی است</strong><span>از ابزارهای سمت صفحه، عنصر موردنظر را اضافه کن.</span></div> :
                    activeProject.elements.map(element => {
                      const g = dragPreview?.id === element.id ? dragPreview : {x:element.x??5,y:element.y??5,width:element.width??90,height:element.height??12};
                      return <div key={element.id} data-element-id={element.id}
                        className={`preview-element ${selectedId===element.id?"is-selected":""} preview-${element.type}`}
                        style={{position:"absolute",left:`${g.x}%`,top:`${g.y}%`,width:`${g.width}%`,minHeight:element.type==="divider"?"2px":`${Math.max(24,g.height/100*430)}px`,color:element.color,backgroundColor:element.background,fontSize:`${element.fontSize}px`,padding:`${element.padding}px`,borderRadius:`${element.radius}px`,textAlign:element.align,touchAction:"none"}}
                        onPointerDown={event=>startElementGesture(event,element,"move")} onPointerMove={moveElementGesture} onPointerUp={finishElementGesture} onPointerCancel={finishElementGesture}>
                        {element.type==="button"?<span className="preview-button-label">{element.text}</span>:element.type==="input"?<span className="preview-input-label">{element.text}</span>:element.type==="card"?<span className="preview-card-label">{element.text}</span>:element.type==="heading"?<strong>{element.text}</strong>:element.type==="image"?(element.text.startsWith("data:image/")?<img className="preview-image-placeholder" src={element.text} alt="تصویر انتخاب‌شده" draggable={false}/>:<span className="preview-image-placeholder">{element.text||"برای انتخاب تصویر، از تنظیمات استفاده کن"}</span>):element.type==="divider"?<span className="preview-divider-line"/>:element.type==="badge"?<span className="preview-badge-label">{element.text}</span>:element.type==="checkbox"?<span>□ {element.text}</span>:element.type==="spacer"?<span className="preview-spacer-label">فاصله</span>:<span>{element.text}</span>}
                        {selectedId===element.id&&<button className="element-resize-handle" aria-label="تغییر اندازه عنصر" onPointerDown={event=>startElementGesture(event,element,"resize")} onPointerMove={moveElementGesture} onPointerUp={finishElementGesture}><Maximize2 size={12}/></button>}
                      </div>;
                    })}
                </div>
              </div>
            </div>
            <div className="canvas-bottom-note">{activeProject.elements.length.toLocaleString("fa")} عنصر در صفحه · تغییرات به‌صورت خودکار ذخیره می‌شوند</div>
          </section>

          <aside className="builder-panel builder-properties">
            <div className="builder-panel-title"><span><Palette size={17} /> تنظیمات عنصر</span>
              <button onClick={deleteSelectedElement} disabled={!selectedElement} aria-label="حذف عنصر انتخاب‌شده" title="حذف عنصر"><Trash2 size={17} /></button>
            </div>
            {!selectedElement ? <div className="builder-muted properties-empty">برای ویرایش، یک عنصر را از پیش‌نمایش یا فهرست لایه‌ها انتخاب کن.</div> : <>
              {selectedElement.type === "image" ? <div className="image-picker-control">
                <label className="property-label">تصویر عنصر</label>
                {selectedElement.text.startsWith("data:image/") && <img className="image-picker-preview" src={selectedElement.text} alt="پیش‌نمایش تصویر انتخاب‌شده" />}
                <button type="button" className="settings-action" onClick={() => imageInputRef.current?.click()}><ImageIcon size={17} /> {selectedElement.text.startsWith("data:image/") ? "تغییر تصویر" : "انتخاب تصویر از دستگاه"}</button>
                <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={event => chooseImage(event.target.files?.[0])} />
                <small>فرمت‌های تصویری رایج · حداکثر ۸ مگابایت</small>
              </div> : <label className="property-label" htmlFor="selected-element-text">متن عنصر</label>}
              {selectedElement.type !== "image" && <>
              <textarea id="selected-element-text" value={selectedElement.text} onChange={event => updateElement(selectedElement.id, { text: event.target.value })} />
              <div className="property-field"><label htmlFor="element-color">رنگ متن</label><input id="element-color" type="color" value={selectedElement.color} onChange={event => updateElement(selectedElement.id, { color: event.target.value })} /></div>
              <div className="property-field"><label htmlFor="element-background">رنگ پس‌زمینه</label><input id="element-background" type="color" value={selectedElement.background} onChange={event => updateElement(selectedElement.id, { background: event.target.value })} /></div>
              <div className="property-range"><label htmlFor="element-font-size">اندازه متن <strong>{selectedElement.fontSize}</strong></label><input id="element-font-size" type="range" min="10" max="36" value={selectedElement.fontSize} onChange={event => updateElement(selectedElement.id, { fontSize: Number(event.target.value) })} /></div>
              <div className="property-range"><label htmlFor="element-padding">فاصله داخلی <strong>{selectedElement.padding}</strong></label><input id="element-padding" type="range" min="0" max="32" value={selectedElement.padding} onChange={event => updateElement(selectedElement.id, { padding: Number(event.target.value) })} /></div>
              <div className="property-range"><label htmlFor="element-margin">فاصله بیرونی <strong>{selectedElement.margin ?? 7}</strong></label><input id="element-margin" type="range" min="0" max="40" value={selectedElement.margin ?? 7} onChange={event => updateElement(selectedElement.id, { margin: Number(event.target.value) })} /></div>
              <div className="property-range"><label htmlFor="element-width">عرض عنصر <strong>{Math.round(selectedElement.width??90)}%</strong></label><input id="element-width" type="range" min="8" max="100" value={selectedElement.width??90} onChange={event=>updateElement(selectedElement.id,{width:Number(event.target.value)})}/></div>
              <div className="property-range"><label htmlFor="element-height">ارتفاع عنصر <strong>{Math.round(selectedElement.height??12)}%</strong></label><input id="element-height" type="range" min="4" max="70" value={selectedElement.height??12} onChange={event=>updateElement(selectedElement.id,{height:Number(event.target.value)})}/></div>
              <div className="property-range"><label htmlFor="element-radius">گردی گوشه‌ها <strong>{selectedElement.radius}</strong></label><input id="element-radius" type="range" min="0" max="32" value={selectedElement.radius} onChange={event => updateElement(selectedElement.id, { radius: Number(event.target.value) })} /></div>
              <div className="property-align"><span>تراز متن</span><div>
                <button className={selectedElement.align === "right" ? "active" : ""} onClick={() => updateElement(selectedElement.id, { align: "right" })}>راست</button>
                <button className={selectedElement.align === "center" ? "active" : ""} onClick={() => updateElement(selectedElement.id, { align: "center" })}>وسط</button>
                <button className={selectedElement.align === "left" ? "active" : ""} onClick={() => updateElement(selectedElement.id, { align: "left" })}>چپ</button>
              </div></div>
              </>}
              <button className="property-delete-button" onClick={deleteSelectedElement}><Trash2 size={16} /> حذف این عنصر</button>
            </>}
          </aside>
        </div>
        <footer className="builder-footer">
          <span>{savedState === "saving" ? "در حال ذخیره خودکار..." : savedState === "error" ? "ذخیره خودکار ناموفق بود؛ فضای دستگاه را بررسی کن." : "ذخیره خودکار روی همین دستگاه فعال است."}</span>
        </footer>
      </section>}

      {settingsOpen && <div className="app-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
        <section className="app-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <div className="app-modal-heading"><h2 id="settings-title">تنظیمات اپ فلو</h2><button onClick={() => setSettingsOpen(false)} aria-label="بستن"><X size={20} /></button></div>
          <div className="settings-note"><FolderOpen size={20} /><div><strong>ذخیره‌سازی روی دستگاه</strong><span>پروژه‌ها در فضای داخلی همین مرورگر نگهداری می‌شوند. برای انتقال به دستگاه دیگر، فایل پشتیبان بگیر.</span></div></div>
          <button className="settings-action" onClick={exportBackup}><Download size={17} /> دریافت فایل پشتیبان همه پروژه‌ها</button>
          <button className="settings-action" onClick={() => fileInputRef.current?.click()}><FileUp size={17} /> بازیابی پروژه از فایل پشتیبان</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={event => void importBackup(event.target.files?.[0])} />
          <div className="cloud-status">ذخیره‌سازی ابری و حساب کاربری هنوز راه‌اندازی نشده است.</div>
        </section>
      </div>}

      {confirmDelete && <div className="app-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setConfirmDelete(null); }}>
        <section className="app-modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="app-modal-heading"><h2 id="delete-title">حذف پروژه</h2><button onClick={() => setConfirmDelete(null)} aria-label="بستن"><X size={20} /></button></div>
          <p>پروژه «{confirmDelete.name}» حذف شود؟ این کار قابل بازگشت نیست.</p>
          <div className="confirm-actions"><button onClick={() => setConfirmDelete(null)}>انصراف</button><button className="danger-action" onClick={() => void confirmProjectDelete()}>حذف پروژه</button></div>
        </section>
      </div>}

      {toast && <div className="app-toast" role="status">{toast}</div>}
    </main>
  );
}

export default App;
