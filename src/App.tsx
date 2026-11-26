import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Check, ChevronDown, CircleHelp, Copy, Eye, FileText, Folder,
  Image as ImageIcon, Layers, Menu, MoreVertical, Palette, Plus, Save,
  Settings2, Smartphone, Trash2, Type, X, MousePointer2, Square, Minus,
  ListChecks, AlignLeft, ArrowUp, ArrowDown, Download
} from "lucide-react";
import {
  AppProject, ElementKind, VisualElement, createElement, createProject,
  deleteProject, listProjects, saveProject
} from "./lib/projectStore";

type WorkspaceTab = "build" | "layers" | "preview";
const options: { type: ElementKind; title: string; icon: typeof Type; description: string }[] = [
  { type: "heading", title: "عنوان", icon: Type, description: "تیتر و عنوان صفحه" },
  { type: "text", title: "متن", icon: AlignLeft, description: "توضیحات و نوشته" },
  { type: "image", title: "تصویر", icon: ImageIcon, description: "تصویر با نشانی اینترنتی" },
  { type: "button", title: "دکمه", icon: MousePointer2, description: "دکمه قابل لمس" },
  { type: "card", title: "کارت", icon: Square, description: "کادر محتوایی" },
  { type: "input", title: "فیلد ورودی", icon: FileText, description: "دریافت اطلاعات" },
  { type: "checkbox", title: "چک‌باکس", icon: ListChecks, description: "انتخاب یک گزینه" },
  { type: "divider", title: "خط جداکننده", icon: Minus, description: "جداکردن بخش‌ها" },
  { type: "badge", title: "برچسب", icon: Palette, description: "نشان کوچک" },
  { type: "spacer", title: "فاصله", icon: ChevronDown, description: "تنظیم فاصله صفحه" }
];
const labels: Record<ElementKind, string> = {
  heading: "عنوان", text: "متن", image: "تصویر", button: "دکمه", card: "کارت",
  input: "فیلد ورودی", checkbox: "چک‌باکس", divider: "جداکننده", badge: "برچسب", spacer: "فاصله"
};

function App() {
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [active, setActive] = useState<AppProject | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<WorkspaceTab>("build");
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const selected = active?.elements.find(item => item.id === selectedId) ?? null;

  useEffect(() => { listProjects().then(setProjects).catch(() => setProjects([])); }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = (message: string) => setToast(message);
  const persist = async (project: AppProject) => {
    setSaving(true);
    try {
      await saveProject(project);
      setProjects(current => [project, ...current.filter(p => p.id !== project.id)].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch { notify("ذخیره انجام نشد. فضای ذخیره‌سازی دستگاه را بررسی کن."); }
    finally { setSaving(false); }
  };
  const updateProject = (patch: Partial<AppProject>) => {
    if (!active) return;
    const next = { ...active, ...patch, updatedAt: new Date().toISOString() };
    setActive(next);
    void persist(next);
  };
  const updateElement = (id: string, patch: Partial<VisualElement>) => {
    if (!active) return;
    updateProject({ elements: active.elements.map(item => item.id === id ? { ...item, ...patch } : item) });
  };
  const createNew = () => {
    const project = createProject("اپلیکیشن من");
    setActive(project);
    setSelectedId(null);
    setTab("build");
    void persist(project);
  };
  const openProject = (project: AppProject) => {
    setActive(project);
    setSelectedId(null);
    setTab("build");
    setDrawer(false);
  };
  const addElement = (type: ElementKind) => {
    if (!active) return;
    const element = createElement(type);
    updateProject({ elements: [...active.elements, element] });
    setSelectedId(element.id);
    setTab("build");
  };
  const removeElement = (id: string) => {
    if (!active) return;
    updateProject({ elements: active.elements.filter(item => item.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };
  const moveElement = (id: string, step: -1 | 1) => {
    if (!active) return;
    const list = [...active.elements];
    const index = list.findIndex(item => item.id === id);
    const target = index + step;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    updateProject({ elements: list });
  };
  const goHome = () => { setActive(null); setSelectedId(null); setDrawer(false); };
  const filtered = useMemo(() => projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase())), [projects, query]);

  if (!active) return (
    <div className="af-app" dir="rtl">
      <header className="af-home-head">
        <button className="af-menu-button" onClick={() => setDrawer(true)} aria-label="باز کردن منو"><Menu/></button>
        <div className="af-brand"><span className="af-brand-mark">A</span><span>APP FLOW<small>استودیوی ساخت اپلیکیشن</small></span></div>
        <button className="af-help" onClick={() => notify("راهنمای شروع به‌زودی اضافه می‌شود.")}><CircleHelp/></button>
      </header>
      {drawer && <><button className="af-scrim" onClick={() => setDrawer(false)} aria-label="بستن منو"/><aside className="af-drawer">
        <div className="af-drawer-top"><div className="af-brand"><span className="af-brand-mark">A</span><span>APP FLOW<small>منوی اصلی</small></span></div><button onClick={() => setDrawer(false)}><X/></button></div>
        <button className="af-drawer-link current" onClick={() => setDrawer(false)}><Folder/> پروژه‌های من</button>
        <button className="af-drawer-link" onClick={() => { setDrawer(false); notify("راهنمای شروع به‌زودی اضافه می‌شود."); }}><CircleHelp/> راهنمای استفاده</button>
        <div className="af-drawer-note">از یک صفحه خالی شروع کن و اپلیکیشن دلخواهت را بساز.</div>
      </aside></>}
      <main className="af-home-content">
        <section className="af-welcome">
          <span className="af-eyebrow">فضای ساخت تو</span>
          <h1>هر ایده‌ای،<br/><em>یک اپلیکیشن.</em></h1>
          <p>بدون قالب آماده؛ صفحه‌ات را از صفر و دقیقاً مطابق سلیقه خودت بساز.</p>
          <button className="af-primary af-create" onClick={createNew}><Plus/> ساخت اپلیکیشن جدید</button>
          <div className="af-welcome-foot"><span><Check/> شروع از صفحه خالی</span><span><Smartphone/> مخصوص اپ اندروید</span></div>
        </section>
        <section className="af-project-section">
          <div className="af-section-head"><div><span className="af-eyebrow">کتابخانه</span><h2>پروژه‌های من</h2></div><span className="af-project-count">{projects.length} پروژه</span></div>
          {projects.length > 0 && <label className="af-search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="جست‌وجوی پروژه‌ها"/></label>}
          {filtered.length ? <div className="af-project-list">{filtered.map(project => <article className="af-project-card" key={project.id}>
            <button className="af-project-open" onClick={() => openProject(project)}><span className="af-project-icon"><Smartphone/></span><span className="af-project-info"><b>{project.name}</b><small>{project.elements.length} جزء · آخرین ویرایش {new Date(project.updatedAt).toLocaleDateString("fa-IR")}</small></span><ArrowRight/></button>
            <button className="af-project-delete" aria-label="حذف پروژه" onClick={async () => { if (window.confirm("این پروژه حذف شود؟")) { await deleteProject(project.id); setProjects(current => current.filter(p => p.id !== project.id)); } }}><Trash2/></button>
          </article>)}</div> : <div className="af-empty-projects"><div className="af-empty-icon"><Layers/></div><b>{projects.length ? "پروژه‌ای پیدا نشد" : "هنوز پروژه‌ای نساختی"}</b><p>{projects.length ? "نام دیگری را جست‌وجو کن." : "اولین اپلیکیشن خودت را از یک صفحه خالی شروع کن."}</p>{!projects.length && <button onClick={createNew}>شروع ساخت <ArrowLeftIcon/></button>}</div>}
        </section>
        <footer className="af-home-footer">APP FLOW <span>·</span> ساخت آزادانه اپلیکیشن اندروید</footer>
      </main>
      {toast && <div className="af-toast"><Check/>{toast}</div>}
    </div>
  );

  return (
    <div className="af-app af-studio" dir="rtl">
      <header className="af-studio-head">
        <button className="af-back" onClick={goHome}><ArrowRight/><span>پروژه‌ها</span></button>
        <div className="af-project-title"><span className="af-brand-mark">A</span><input aria-label="نام اپلیکیشن" value={active.name} onChange={e => updateProject({ name: e.target.value })}/></div>
        <span className="af-save-state">{saving ? "در حال ذخیره…" : <><Check/> ذخیره شد</>}</span>
      </header>
      <main className="af-studio-main">
        {tab === "build" && <section className="af-build-view">
          <div className="af-view-heading"><div><span className="af-eyebrow">ویرایشگر</span><h1>چی به صفحه اضافه کنیم؟</h1><p>هر جزء را انتخاب کن؛ بعد می‌توانی ظاهرش را تغییر بدهی.</p></div><span className="af-step">۱ / ساخت</span></div>
          <div className="af-element-grid">{options.map(option => { const Icon = option.icon; return <button className="af-element-option" key={option.type} onClick={() => addElement(option.type)}><span className="af-option-icon"><Icon/></span><span><b>{option.title}</b><small>{option.description}</small></span><Plus className="af-option-plus"/></button>; })}</div>
          <div className="af-build-hint"><Layers/><span>اجزایی که اضافه می‌کنی در بخش «لایه‌ها» مرتب می‌شوند و در پیش‌نمایش، نتیجه واقعی را می‌بینی.</span></div>
        </section>}
        {tab === "layers" && <section className="af-layers-view">
          <div className="af-view-heading"><div><span className="af-eyebrow">ساختار اپلیکیشن</span><h1>اجزای صفحه</h1><p>{active.elements.length} جزء در صفحه فعلی</p></div><span className="af-step">۲ / مدیریت</span></div>
          {active.elements.length ? <div className="af-layer-list">{active.elements.map((item,index) => <article className={selectedId === item.id ? "af-layer selected" : "af-layer"} key={item.id}>
            <button className="af-layer-main" onClick={() => { setSelectedId(item.id); setTab("build"); }}><span className="af-layer-number">{index+1}</span><span><b>{labels[item.type]}</b><small>{item.text || "بدون متن"}</small></span></button>
            <div className="af-layer-actions"><button onClick={() => moveElement(item.id,-1)} aria-label="انتقال به بالا"><ArrowUp/></button><button onClick={() => moveElement(item.id,1)} aria-label="انتقال به پایین"><ArrowDown/></button><button onClick={() => removeElement(item.id)} aria-label="حذف"><Trash2/></button></div>
          </article>)}</div> : <div className="af-empty-projects"><div className="af-empty-icon"><Layers/></div><b>صفحه هنوز خالی است</b><p>از بخش ساخت، اولین جزء را اضافه کن.</p><button onClick={() => setTab("build")}>افزودن جزء <ArrowLeftIcon/></button></div>}
        </section>}
        {tab === "preview" && <section className="af-preview-view">
          <div className="af-view-heading"><div><span className="af-eyebrow">نمای واقعی اپلیکیشن</span><h1>پیش‌نمایش اپ تو</h1><p>این همان محتوایی است که خودت ساخته‌ای.</p></div><span className="af-live"><i/> زنده</span></div>
          <div className="af-live-preview">
            <div className="af-live-appbar"><b>{active.name || "اپلیکیشن من"}</b><span>●●●</span></div>
            <div className="af-live-content">
              {active.elements.length ? active.elements.map(item => <LiveElement key={item.id} item={item}/>) : <div className="af-live-empty"><Smartphone/><b>صفحه اپلیکیشن خالی است</b><span>به بخش ساخت برگرد و اجزای دلخواهت را اضافه کن.</span><button onClick={() => setTab("build")}>شروع طراحی</button></div>}
            </div>
          </div>
          <p className="af-preview-note"><Eye/> پیش‌نمایش از داده‌های واقعی پروژه ساخته می‌شود؛ نمونه یا تصویر از پیش آماده نیست.</p>
        </section>}
      </main>
      {selected && tab === "build" && <section className="af-properties">
        <div className="af-properties-head"><div><span className="af-eyebrow">تنظیمات جزء انتخاب‌شده</span><b>{labels[selected.type]}</b></div><button onClick={() => setSelectedId(null)} aria-label="بستن تنظیمات"><X/></button></div>
        <label className="af-field">{selected.type === "image" ? "آدرس تصویر (URL)" : "متن"}<input value={selected.text} onChange={e => updateElement(selected.id,{text:e.target.value})} placeholder={selected.type === "image" ? "https://example.com/image.jpg" : "متن دلخواهت را بنویس"}/></label>
        {selected.type !== "image" && selected.type !== "divider" && selected.type !== "spacer" && <div className="af-fields-two">
          <label className="af-field">رنگ نوشته<input type="color" value={selected.color} onChange={e => updateElement(selected.id,{color:e.target.value})}/></label>
          <label className="af-field">رنگ پس‌زمینه<input type="color" value={selected.background} onChange={e => updateElement(selected.id,{background:e.target.value})}/></label>
        </div>}
        <label className="af-field">اندازه نوشته <span className="af-range-value">{selected.fontSize}px</span><input type="range" min="10" max="36" value={selected.fontSize} onChange={e => updateElement(selected.id,{fontSize:Number(e.target.value)})}/></label>
        <div className="af-fields-two">
          <label className="af-field">فاصله داخلی <input type="range" min="0" max="32" value={selected.padding} onChange={e => updateElement(selected.id,{padding:Number(e.target.value)})}/></label>
          <label className="af-field">گردی گوشه <input type="range" min="0" max="30" value={selected.radius} onChange={e => updateElement(selected.id,{radius:Number(e.target.value)})}/></label>
        </div>
        <label className="af-field">تراز نوشته<select value={selected.align} onChange={e => updateElement(selected.id,{align:e.target.value as VisualElement["align"]})}><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option></select></label>
        <button className="af-delete-selected" onClick={() => removeElement(selected.id)}><Trash2/> حذف این جزء</button>
      </section>}
      <nav className="af-bottom-nav">
        <button className={tab === "build" ? "active" : ""} onClick={() => setTab("build")}><Plus/><span>ساخت</span></button>
        <button className={tab === "layers" ? "active" : ""} onClick={() => setTab("layers")}><Layers/><span>لایه‌ها ({active.elements.length})</span></button>
        <button className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")}><Eye/><span>پیش‌نمایش</span></button>
      </nav>
      {toast && <div className="af-toast"><Check/>{toast}</div>}
    </div>
  );
}

function LiveElement({ item }: { item: VisualElement }) {
  const style = {
    color: item.color, backgroundColor: item.background, fontSize: item.fontSize,
    padding: item.padding, borderRadius: item.radius, textAlign: item.align as "left" | "right" | "center",
    margin: item.margin + "px 0"
  } as const;
  if (item.type === "divider") return <hr className="af-live-divider"/>;
  if (item.type === "spacer") return <div style={{height: Math.max(12,item.padding*2)}}/>;
  if (item.type === "image") return <div className="af-live-image">{/^https?:\/\//i.test(item.text) ? <img src={item.text} alt="تصویر اپلیکیشن"/> : <><ImageIcon/><span>{item.text || "برای نمایش تصویر، نشانی اینترنتی وارد کن"}</span></>}</div>;
  if (item.type === "input") return <input className="af-live-input" placeholder={item.text || "ورودی اطلاعات"} style={style}/>;
  if (item.type === "checkbox") return <label className="af-live-checkbox" style={style}><input type="checkbox"/>{item.text}</label>;
  if (item.type === "button") return <button className="af-live-button" style={style}>{item.text}</button>;
  if (item.type === "badge") return <span className="af-live-badge" style={style}>{item.text}</span>;
  if (item.type === "card") return <div className="af-live-card" style={style}>{item.text}</div>;
  if (item.type === "heading") return <h2 className="af-live-heading" style={style}>{item.text}</h2>;
  return <p className="af-live-text" style={style}>{item.text}</p>;
}

function ArrowLeftIcon() { return <ArrowRight className="af-left-arrow"/>; }
export default App;
