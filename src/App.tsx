import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bell, Check, ChevronDown,
  CircleHelp, Code2, Copy, Download, Eye, FilePlus2, Folder, Grid2X2,
  Home, ImagePlus, Layers3, LayoutTemplate, Menu, MoreHorizontal,
  Plus, Search, Settings2, Smartphone, Sparkles, Store, Trash2, Type,
  Upload, WandSparkles, X
} from "lucide-react";
import {
  AppProject, ElementKind, VisualElement, createElement, createProject,
  deleteProject, listProjects, parseProjectBackup, saveProject
} from "./lib/projectStore";

type Screen = "home" | "editor";
type Template = { id: string; title: string; detail: string; icon: typeof Store; color: string; elements: ElementKind[] };

const templates: Template[] = [
  { id: "shop", title: "فروشگاه آنلاین", detail: "محصولات، دسته‌بندی و سبد خرید", icon: Store, color: "blue", elements: ["heading", "text", "card", "button"] },
  { id: "profile", title: "اپلیکیشن شخصی", detail: "معرفی، نمونه‌کار و راه‌های ارتباطی", icon: Smartphone, color: "violet", elements: ["heading", "text", "image", "button"] },
  { id: "service", title: "ارائه خدمات", detail: "خدمات، رزرو و ثبت درخواست", icon: Grid2X2, color: "orange", elements: ["heading", "text", "card", "button", "input"] },
];

const elementOptions: { type: ElementKind; label: string; icon: typeof Type; hint: string }[] = [
  { type: "heading", label: "عنوان", icon: Type, hint: "تیتر اصلی صفحه" },
  { type: "text", label: "متن", icon: FilePlus2, hint: "متن توضیحی" },
  { type: "button", label: "دکمه", icon: Plus, hint: "دکمه قابل نمایش" },
  { type: "image", label: "تصویر", icon: ImagePlus, hint: "جایگاه تصویر" },
  { type: "card", label: "کارت", icon: LayoutTemplate, hint: "بخش محتوایی" },
  { type: "input", label: "ورودی", icon: Code2, hint: "فیلد ورود اطلاعات" },
];

const kindLabels: Record<ElementKind, string> = {
  heading: "عنوان", text: "متن", button: "دکمه", image: "تصویر",
  card: "کارت", input: "ورودی", divider: "جداکننده", badge: "برچسب",
  checkbox: "چک‌باکس", spacer: "فاصله"
};

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [active, setActive] = useState<AppProject | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [preview, setPreview] = useState<"phone" | "tablet">("phone");
  const [mobilePanel, setMobilePanel] = useState<"preview" | "layers" | "properties">("preview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => { listProjects().then(setProjects).catch(() => setProjects([])); }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selected = active?.elements.find(item => item.id === selectedId) ?? null;
  const filteredProjects = useMemo(() => projects.filter(project => project.name.toLowerCase().includes(query.toLowerCase())), [projects, query]);

  const notify = (message: string) => setToast(message);
  const persist = async (project: AppProject) => {
    setSaving(true);
    try {
      await saveProject(project);
      setProjects(current => [project, ...current.filter(item => item.id !== project.id)].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch { notify("ذخیره انجام نشد؛ فضای مرورگر را بررسی کن."); }
    finally { setSaving(false); }
  };

  const updateActive = (patch: Partial<AppProject>) => {
    if (!active) return;
    const next = { ...active, ...patch, updatedAt: new Date().toISOString() };
    setActive(next);
    void persist(next);
  };

  const openProject = (project: AppProject) => {
    setActive(project);
    setSelectedId(project.elements[0]?.id ?? null);
    setMobilePanel("preview");
    setScreen("editor");
  };

  const makeProject = (template?: Template) => {
    const project = createProject(template ? `اپلیکیشن ${template.title}` : "اپلیکیشن جدید");
    if (template) project.elements = template.elements.map(type => createElement(type));
    setProjects(current => [project, ...current]);
    setShowTemplates(false);
    openProject(project);
    void persist(project);
  };

  const addElement = (type: ElementKind) => {
    if (!active) return;
    const item = createElement(type);
    updateActive({ elements: [...active.elements, item] });
    setSelectedId(item.id);
    setMobilePanel("properties");
  };

  const updateElement = (id: string, patch: Partial<VisualElement>) => {
    if (!active) return;
    updateActive({ elements: active.elements.map(item => item.id === id ? { ...item, ...patch } : item) });
  };

  const removeElement = (id: string) => {
    if (!active) return;
    updateActive({ elements: active.elements.filter(item => item.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const moveElement = (id: string, direction: -1 | 1) => {
    if (!active) return;
    const items = [...active.elements];
    const index = items.findIndex(item => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    updateActive({ elements: items });
  };

  const duplicateProject = (project: AppProject) => {
    const copy = { ...project, id: crypto.randomUUID(), name: project.name + " (کپی)", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), elements: project.elements.map(item => ({ ...item, id: crypto.randomUUID() })) };
    setProjects(current => [copy, ...current]);
    void persist(copy);
    setMenuFor(null);
    notify("یک نسخه کپی ساخته شد.");
  };

  const removeProject = async (project: AppProject) => {
    if (!window.confirm(`پروژه «${project.name}» حذف شود؟`)) return;
    await deleteProject(project.id);
    setProjects(current => current.filter(item => item.id !== project.id));
    setMenuFor(null);
    notify("پروژه حذف شد.");
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "app-flow-backup.json"; link.click();
    URL.revokeObjectURL(url);
    notify("فایل پشتیبان آماده شد.");
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const incoming = parseProjectBackup(await file.text());
      for (const project of incoming) await saveProject(project);
      setProjects(await listProjects());
      notify(`${incoming.length} پروژه بازیابی شد.`);
    } catch { notify("فایل انتخاب‌شده معتبر نیست."); }
    if (importRef.current) importRef.current.value = "";
  };

  const backHome = () => { setScreen("home"); setActive(null); setSelectedId(null); };

  if (screen === "editor" && active) {
    return (
      <div className="studio" dir="rtl">
        <header className="studio-top">
          <button className="back-home" onClick={backHome}><ArrowRight size={18}/><span>پروژه‌ها</span></button>
          <div className="studio-project-name"><span className="tiny-mark">A</span><input aria-label="نام پروژه" value={active.name} onChange={e => updateActive({ name: e.target.value })}/><span className="save-state">{saving ? "در حال ذخیره" : <><Check size={13}/> ذخیره شد</>}</span></div>
          <div className="studio-actions"><button className="icon-btn" title="پیش‌نمایش"><Eye size={18}/></button><button className="publish-btn" onClick={() => notify("خروجی APK در نسخه‌های بعدی اضافه می‌شود.")}>انتشار اپ <ArrowLeft size={16}/></button></div>
        </header>
        <div className="studio-body">
          <aside className="studio-rail">
            <button className={mobilePanel === "layers" ? "rail-btn active" : "rail-btn"} onClick={() => setMobilePanel("layers")} title="اجزا"><Layers3/></button>
            <button className={mobilePanel === "properties" ? "rail-btn active" : "rail-btn"} onClick={() => setMobilePanel("properties")} title="تنظیمات"><Settings2/></button>
            <div className="rail-spacer"/>
            <button className="rail-btn" onClick={() => notify("راهنمای ویرایشگر به‌زودی اضافه می‌شود.")} title="راهنما"><CircleHelp/></button>
          </aside>
          <aside className={mobilePanel === "layers" ? "side-panel show" : "side-panel"}>
            <div className="panel-heading"><div><span className="eyebrow">ساختار صفحه</span><h2>اجزای اپلیکیشن</h2></div><span className="count-pill">{active.elements.length}</span></div>
            <div className="add-grid">
              {elementOptions.map(option => { const Icon = option.icon; return <button key={option.type} onClick={() => addElement(option.type)}><Icon size={17}/><span>{option.label}</span></button>; })}
            </div>
            <div className="section-label"><span>لایه‌ها</span><span>از بالا به پایین</span></div>
            <div className="layer-list">
              {active.elements.map((item, index) => <div key={item.id} className={selectedId === item.id ? "layer-item selected" : "layer-item"}><button className="layer-select" onClick={() => {setSelectedId(item.id);setMobilePanel("properties");}}><span className="layer-index">{String(index+1).padStart(2,"0")}</span><span className="layer-copy"><b>{kindLabels[item.type]}</b><small>{item.text || "بدون عنوان"}</small></span></button><div className="layer-controls"><button onClick={() => moveElement(item.id,-1)} title="بالا"><ArrowUp size={13}/></button><button onClick={() => moveElement(item.id,1)} title="پایین"><ArrowDown size={13}/></button><button onClick={() => removeElement(item.id)} title="حذف"><Trash2 size={13}/></button></div></div>)}
              {active.elements.length === 0 && <div className="empty-layers"><Layers3 size={25}/><b>صفحه هنوز خالی است</b><span>از بخش بالا یک جزء اضافه کن.</span></div>}
            </div>
            <div className="panel-footnote"><Sparkles size={14}/> هر جزء را انتخاب کن و تنظیماتش را تغییر بده.</div>
          </aside>
          <main className="canvas-area">
            <div className="canvas-toolbar"><div><span className="eyebrow">پیش‌نمایش زنده</span><b>صفحه اصلی</b></div><div className="device-switch"><button className={preview === "phone" ? "chosen" : ""} onClick={() => setPreview("phone")}><Smartphone size={15}/> موبایل</button><button className={preview === "tablet" ? "chosen" : ""} onClick={() => setPreview("tablet")}>تبلت</button></div><span className="zoom-label">100%</span></div>
            <div className="device-stage">
              <div className={preview === "phone" ? "device phone" : "device tablet"}>
                <div className="device-status"><span>۹:۴۱</span><span>●●● ▰</span></div>
                <div className="app-preview">
                  <div className="preview-appbar"><span className="preview-logo">اپ</span><b>{active.name || "اپلیکیشن من"}</b><MoreHorizontal size={18}/></div>
                  {active.elements.map(item => <PreviewElement key={item.id} item={item} selected={selectedId === item.id} onSelect={() => {setSelectedId(item.id);setMobilePanel("properties");}}/>)}
                  {active.elements.length === 0 && <div className="preview-placeholder"><div className="placeholder-icon"><Smartphone size={25}/></div><b>اینجا صفحه اپ توئه</b><span>از پنل کناری اجزا رو اضافه کن تا پیش‌نمایش رو ببینی.</span></div>}
                </div>
                <div className="device-home-indicator"/>
              </div>
            </div>
            <div className="canvas-caption"><span className="live-dot"/> پیش‌نمایش تعاملی · تغییرات بلافاصله نمایش داده می‌شوند</div>
          </main>
          <aside className={mobilePanel === "properties" ? "properties-panel show" : "properties-panel"}>
            <div className="panel-heading"><div><span className="eyebrow">ویرایش جزئیات</span><h2>ویژگی‌ها</h2></div><Settings2 size={18}/></div>
            {selected ? <div className="property-form">
              <label>متن یا عنوان<input value={selected.text} onChange={e => updateElement(selected.id,{text:e.target.value})}/></label>
              <div className="field-row"><label>رنگ متن<input type="color" value={selected.color} onChange={e => updateElement(selected.id,{color:e.target.value})}/></label><label>رنگ زمینه<input type="color" value={selected.background} onChange={e => updateElement(selected.id,{background:e.target.value})}/></label></div>
              <label>اندازه نوشته <div className="range-line"><input type="range" min="10" max="32" value={selected.fontSize} onChange={e => updateElement(selected.id,{fontSize:Number(e.target.value)})}/><b>{selected.fontSize}px</b></div></label>
              <label>فاصله داخلی <div className="range-line"><input type="range" min="0" max="32" value={selected.padding} onChange={e => updateElement(selected.id,{padding:Number(e.target.value)})}/><b>{selected.padding}px</b></div></label>
              <label>گردی گوشه‌ها <div className="range-line"><input type="range" min="0" max="28" value={selected.radius} onChange={e => updateElement(selected.id,{radius:Number(e.target.value)})}/><b>{selected.radius}px</b></div></label>
              <label>تراز متن<select value={selected.align} onChange={e => updateElement(selected.id,{align:e.target.value as VisualElement["align"]})}><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option></select></label>
              <button className="delete-element" onClick={() => removeElement(selected.id)}><Trash2 size={15}/> حذف این جزء</button>
            </div> : <div className="no-selection"><Settings2 size={25}/><b>چیزی انتخاب نشده</b><span>برای ویرایش، یک جزء از لیست یا پیش‌نمایش انتخاب کن.</span></div>}
          </aside>
        </div>
        <div className="mobile-editor-tabs"><button className={mobilePanel==="preview"?"active":""} onClick={()=>setMobilePanel("preview")}><Eye size={17}/> پیش‌نمایش</button><button className={mobilePanel==="layers"?"active":""} onClick={()=>setMobilePanel("layers")}><Layers3 size={17}/> افزودن اجزا</button><button className={mobilePanel==="properties"?"active":""} onClick={()=>setMobilePanel("properties")}><Settings2 size={17}/> تنظیمات</button></div>
        {toast && <div className="toast"><Check size={16}/>{toast}</div>}
      </div>
    );
  }

  return (
    <div className="app-shell" dir="rtl">
      {mobileMenuOpen && <button className="mobile-drawer-backdrop" aria-label="بستن منو" onClick={() => setMobileMenuOpen(false)}/>}
      <aside className={mobileMenuOpen ? "sidebar mobile-open" : "sidebar"}>
        <div className="mobile-drawer-head"><div className="brand-symbol">A</div><div><strong>APP FLOW</strong><small>منوی اصلی</small></div><button aria-label="بستن منو" onClick={() => setMobileMenuOpen(false)}><X size={20}/></button></div>
        <div className="brand-lockup"><div className="brand-symbol">A</div><div><strong>APP FLOW</strong><small>APP CREATION STUDIO</small></div></div>
        <div className="workspace-switch"><div className="workspace-avatar">N</div><div><b>فضای کاری من</b><small>حساب شخصی</small></div><ChevronDown size={15}/></div>
        <div className="nav-caption">فضای کار</div>
        <button className="nav-item active" onClick={() => setMobileMenuOpen(false)}><Home size={18}/><span>داشبورد</span><span className="nav-active-dot"/></button>
        <button className="nav-item" onClick={() => {setShowTemplates(true);setMobileMenuOpen(false);}}><LayoutTemplate size={18}/><span>قالب‌های آماده</span></button>
        <button className="nav-item" onClick={() => {exportBackup();setMobileMenuOpen(false);}}><Download size={18}/><span>پشتیبان‌گیری</span></button>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><WandSparkles size={18}/></div><b>از ایده تا اپلیکیشن</b><p>صفحه‌هایت را طراحی کن و قدم‌به‌قدم اپ خودت را بساز.</p><button onClick={() => notify("راهنمای شروع به‌زودی آماده می‌شود.")}>راهنمای شروع <ArrowLeft size={14}/></button></div><div className="user-profile"><div className="user-avatar">N</div><div><b>کاربر APP FLOW</b><small>نسخه آزمایشی</small></div><button title="تنظیمات" onClick={() => notify("تنظیمات حساب در نسخه بعدی اضافه می‌شود.")}><Settings2 size={17}/></button></div></div>
      </aside>
      <main className="dashboard">
        <header className="dashboard-top"><button className="mobile-menu-trigger" aria-label="باز کردن منو" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(true)}><Menu size={21}/><span>منو</span></button><div className="breadcrumb">فضای کاری <ArrowLeft size={13}/> <b>داشبورد</b></div><div className="top-actions"><span className="local-badge"><span/> ذخیره‌سازی روی دستگاه</span><button className="top-icon" title="اعلان‌ها"><Bell size={18}/></button><button className="top-avatar">N</button></div></header>
        <div className="dashboard-content">
          <section className="welcome-row"><div><span className="eyebrow">استودیوی ساخت اپلیکیشن</span><h1>ایده‌ات رو به <em>اپلیکیشن</em> تبدیل کن.</h1><p>بدون کدنویسی، ظاهر اپ اندرویدی خودت رو طراحی کن.</p></div><div className="welcome-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-phone"><div/><div/><div/></div><span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✦</span></div></section>
          <section className="quick-start"><div className="section-head"><div><h2>شروع یک پروژه تازه</h2><p>یک نقطه شروع انتخاب کن؛ بقیه‌اش با توست.</p></div><button className="text-action" onClick={() => setShowTemplates(true)}>مشاهده همه قالب‌ها <ArrowLeft size={15}/></button></div><div className="template-grid">{templates.map(template => {const Icon=template.icon;return <button className="template-card" key={template.id} onClick={() => makeProject(template)}><div className={`template-icon ${template.color}`}><Icon size={21}/></div><div className="template-info"><b>{template.title}</b><span>{template.detail}</span></div><ArrowLeft className="template-arrow" size={17}/></button>;})}</div></section>
          <section className="projects-section"><div className="section-head"><div><h2>پروژه‌های من <span className="project-total">{projects.length}</span></h2><p>پروژه‌هایی که طراحی آن‌ها را شروع کرده‌ای.</p></div><div className="project-tools"><label className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="جست‌وجوی پروژه..."/></label><button className="new-project-btn" onClick={() => makeProject()}><Plus size={17}/> پروژه جدید</button></div></div>
            {filteredProjects.length ? <div className="project-grid">{filteredProjects.map(project => <article className="project-card" key={project.id}><button className="project-open" onClick={() => openProject(project)}><div className="project-thumb"><div className="thumb-device"><div className="thumb-topline"/><div className="thumb-title"/><div className="thumb-card"/><div className="thumb-button"/></div><span className="project-kind">ANDROID APP</span></div><div className="project-meta"><div><b>{project.name}</b><span>آخرین تغییر: {new Date(project.updatedAt).toLocaleDateString("fa-IR")}</span></div><span className="project-open-arrow"><ArrowLeft size={16}/></span></div></button><div className="project-menu-wrap"><button className="project-menu" onClick={() => setMenuFor(menuFor === project.id ? null : project.id)}><MoreHorizontal size={18}/></button>{menuFor===project.id && <div className="project-menu-pop"><button onClick={() => duplicateProject(project)}><Copy size={14}/> ساخت کپی</button><button className="danger" onClick={() => void removeProject(project)}><Trash2 size={14}/> حذف پروژه</button></div>}</div></article>)}</div> : <div className="empty-projects"><div className="empty-illustration"><Folder size={29}/><Plus size={16}/></div><b>{query ? "پروژه‌ای پیدا نشد" : "هنوز پروژه‌ای نساختی"}</b><span>{query ? "عبارت دیگری را جست‌وجو کن." : "اولین اپلیکیشن اندرویدی خودت را همین‌جا شروع کن."}</span>{!query && <button onClick={() => setShowTemplates(true)}>ساخت اولین اپلیکیشن <ArrowLeft size={15}/></button>}</div>}
          </section>
          <footer className="dashboard-footer"><span>APP FLOW <b>·</b> نسخه MVP</span><span>طراحی اپلیکیشن اندرویدی، ساده‌تر از همیشه.</span></footer>
        </div>
      </main>
      {showTemplates && <div className="modal-backdrop" onClick={() => setShowTemplates(false)}><section className="template-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">شروع سریع</span><h2>چطور می‌خوای شروع کنی؟</h2></div><button onClick={() => setShowTemplates(false)}><X size={19}/></button></div><button className="blank-template" onClick={() => makeProject()}><div className="template-icon neutral"><Plus size={21}/></div><div><b>صفحه خالی</b><span>از صفر، با کنترل کامل طراحی کن.</span></div><ArrowLeft size={17}/></button>{templates.map(template => {const Icon=template.icon;return <button className="modal-template" key={template.id} onClick={() => makeProject(template)}><div className={`template-icon ${template.color}`}><Icon size={20}/></div><div><b>{template.title}</b><span>{template.detail}</span></div><ArrowLeft size={16}/></button>;})}</section></div>}
      <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={e => void importBackup(e.target.files?.[0])}/>
      {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    </div>
  );
}

function PreviewElement({ item, selected, onSelect }: { item: VisualElement; selected: boolean; onSelect: () => void }) {
  const style = { color: item.color, backgroundColor: item.background, fontSize: item.fontSize, padding: item.padding, borderRadius: item.radius, textAlign: item.align as "left" | "right" | "center" };
  return <button type="button" className={`preview-element ${item.type} ${selected ? "is-selected" : ""}`} style={style} onClick={onSelect}>
    {item.type === "image" ? <><ImagePlus size={22}/><span>{item.text}</span></> : item.type === "input" ? <span>{item.text || "متن ورودی"}</span> : item.type === "button" ? item.text : item.text}
  </button>;
}

export default App;
