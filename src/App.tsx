import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Undo2, Redo2, Save, MoreVertical, Plus, Smartphone,
  LayoutGrid, Type, MousePointer2, Image as ImageIcon, Link2, Square,
  Rows3, Columns3, ScrollText, Radio, PanelsTopLeft, Layers, Trash2,
  Copy, ChevronDown, Eye, Code2, Zap, Search, X
} from "lucide-react";

type Block = { id: number; type: string; label: string; text: string };
const tools = [
  { title: "چیدمان‌ها", items: [
    ["Linear (H)", "چیدمان افقی", Columns3], ["Linear (V)", "چیدمان عمودی", Rows3],
    ["Scroll (H)", "اسکرول افقی", ScrollText], ["Scroll (V)", "اسکرول عمودی", ScrollText],
    ["RadioGroup", "گروه انتخاب", Radio], ["RelativeLayout", "چیدمان نسبی", PanelsTopLeft]
  ]},
  { title: "AndroidX", items: [
    ["TabLayout", "تب‌ها", Layers], ["BottomNavigationView", "ناوبری پایین", LayoutGrid],
    ["CollapsingToolbar", "نوار جمع‌شونده", Rows3], ["CardView", "کارت", Square]
  ]},
  { title: "ابزارک‌ها", items: [
    ["TextView", "متن", Type], ["EditText", "ورودی متن", Type],
    ["Button", "دکمه", MousePointer2], ["ImageView", "تصویر", ImageIcon],
    ["WebView", "نمایش وب", Link2]
  ]}
] as const;

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("View");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<Block[][]>([]);
  const [future, setFuture] = useState<Block[][]>([]);
  const [search, setSearch] = useState("");
  const [projectName, setProjectName] = useState("پروژه جدید");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedBlocks = localStorage.getItem("appflow-editor-blocks");
    if (savedBlocks) {
      try { setBlocks(JSON.parse(savedBlocks)); } catch { /* ignore invalid local data */ }
    }
  }, []);

  const filteredTools = useMemo(() => tools.map(group => ({
    ...group, items: group.items.filter(item => (item[0] + " " + item[1]).toLowerCase().includes(search.toLowerCase()))
  })).filter(group => group.items.length), [search]);

  const addBlock = (type: string, label: string) => {
    setHistory(h => [...h, blocks]); setFuture([]);
    const item: Block = { id: Date.now(), type, label, text: type.includes("Button") ? "دکمه جدید" : type.includes("EditText") ? "متن ورودی" : type.includes("Image") ? "تصویر شما" : label };
    setBlocks(current => [...current, item]); setSelected(item.id); setSaved(false);
  };
  const changeText = (id: number, text: string) => {
    setHistory(h => [...h, blocks]); setFuture([]);
    setBlocks(current => current.map(b => b.id === id ? { ...b, text } : b)); setSaved(false);
  };
  const removeSelected = () => {
    if (selected === null) return;
    setHistory(h => [...h, blocks]); setFuture([]);
    setBlocks(current => current.filter(b => b.id !== selected)); setSelected(null); setSaved(false);
  };
  const undo = () => {
    if (!history.length) return;
    setFuture(f => [blocks, ...f]); setBlocks(history[history.length - 1]); setHistory(h => h.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    setHistory(h => [...h, blocks]); setBlocks(future[0]); setFuture(f => f.slice(1));
  };
  const save = () => {
    localStorage.setItem("appflow-editor-blocks", JSON.stringify(blocks));
    localStorage.setItem("appflow-editor-name", projectName); setSaved(true);
  };

  return (
    <main className="app-shell" dir="rtl">
      {!editorOpen ? <>
        <header className="brand-header">
          <button className="menu-toggle" type="button" aria-label={menuOpen ? "بستن منو" : "باز کردن منو"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23} /> : <MoreVertical size={24} />}</button>
          <h1 className="brand-title">اپ فلو</h1>
          <button className={`menu-backdrop ${menuOpen ? "visible" : ""}`} aria-label="بستن منو" onClick={() => setMenuOpen(false)} />
          <nav className={`hamburger-menu ${menuOpen ? "open" : ""}`} aria-label="منوی اصلی">
            <button className="menu-item active" onClick={() => setMenuOpen(false)}><LayoutGrid size={19} /><span>پروژه‌ها</span></button>
            <button className="menu-item" onClick={() => setMenuOpen(false)}><Zap size={19} /><span>تنظیمات</span></button>
            <a className="menu-item" href="https://rubika.ir/App_Flow" target="_blank" rel="noopener noreferrer"><Type size={19} /><span>آموزش‌ها</span></a>
          </nav>
        </header>
        <div className="app-layout"><section className="workspace">
          <div className="page-heading"><div><h2>پروژه‌های من</h2><p>پروژه‌هایت را اینجا مدیریت کن.</p></div><span className="project-count"><LayoutGrid size={17} /> ۰ پروژه</span></div>
          <button className="create-card" onClick={() => { setEditorOpen(true); setBlocks([]); setProjectName("پروژه جدید"); }}>
            <span className="create-icon"><Plus size={23} strokeWidth={2.2} /></span><span className="create-copy"><strong>ساخت پروژه جدید</strong><span>یک پروژه تازه ایجاد کن</span></span>
          </button>
          <section className="projects-list"><div className="projects-list-heading"><div className="projects-list-title"><LayoutGrid size={19} /><h3>لیست پروژه‌ها</h3></div><span className="projects-list-total">۰ پروژه</span></div><div className="projects-list-empty"><Layers size={25} /><span>هنوز پروژه‌ای ایجاد نشده است.</span></div></section>
        </section></div>
      </> : <section className="editor-shell">
        <header className="editor-topbar">
          <button className="editor-icon" aria-label="بازگشت" onClick={() => setEditorOpen(false)}><ArrowLeft /></button>
          <div className="editor-project-title"><input aria-label="نام پروژه" value={projectName} onChange={e => setProjectName(e.target.value)} /><small>{blocks.length} جزء</small></div>
          <button className="editor-icon" aria-label="بازگردانی" onClick={undo} disabled={!history.length}><Undo2 /></button>
          <button className="editor-icon" aria-label="انجام دوباره" onClick={redo} disabled={!future.length}><Redo2 /></button>
          <button className="editor-icon save-button" aria-label="ذخیره" onClick={save}><Save /></button>
          <button className="editor-icon" aria-label="گزینه‌ها"><MoreVertical /></button>
        </header>
        <nav className="editor-tabs">
          {["View", "Event", "Component"].map(tab => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab === "View" ? "طراحی" : tab === "Event" ? "رویدادها" : "اجزا"}</button>)}
        </nav>
        <div className="editor-workspace">
          <aside className="tool-panel">
            <div className="tool-panel-head"><strong>{activeTab === "View" ? "ابزارها" : activeTab === "Event" ? "رویدادها" : "اجزای پروژه"}</strong><span>افزودن به صفحه</span></div>
            <div className="tool-search"><Search size={16} /><input placeholder="جست‌وجوی ابزار..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            {activeTab === "View" ? filteredTools.map(group => <section className="tool-group" key={group.title}><h3>{group.title}</h3><div className="tool-grid">{group.items.map(([type, label, Icon]) => <button className="tool-item" key={type} onClick={() => addBlock(type, label)}><Icon size={19} /><span>{type}</span></button>)}</div></section>) : activeTab === "Event" ? <div className="panel-empty">برای اجزای صفحه می‌توان رویداد تعریف کرد.</div> : <div className="component-list">{blocks.map(b => <button key={b.id} onClick={() => setSelected(b.id)} className={selected === b.id ? "chosen" : ""}>{b.label}</button>)}</div>}
          </aside>
          <section className="preview-area">
            <div className="preview-toolbar"><span><Eye size={16} /> پیش‌نمایش زنده</span><span className="device-label"><Smartphone size={15} /> صفحه موبایل</span></div>
            <div className="phone-stage"><div className="phone-screen">
              <div className="phone-status"><span>۹:۴۱</span><span>● ● ●</span></div>
              <div className="phone-appbar"><span>{projectName || "پروژه جدید"}</span><MoreVertical size={17} /></div>
              <div className="phone-content">
                {blocks.length === 0 ? <div className="canvas-empty"><Plus size={27} /><strong>صفحه شما خالی است</strong><span>از منوی ابزارها یک جزء انتخاب کنید تا اینجا نمایش داده شود.</span></div> : blocks.map(b => <div key={b.id} className={`canvas-block ${selected === b.id ? "selected" : ""}`} onClick={() => setSelected(b.id)}>
                  {b.type.includes("Button") ? <button className="canvas-button">{b.text}</button> : b.type.includes("Image") ? <div className="canvas-image"><ImageIcon />{b.text}</div> : b.type.includes("EditText") ? <div className="canvas-input">{b.text}</div> : b.type.includes("Card") ? <div className="canvas-card">{b.text}</div> : <span>{b.text}</span>}
                </div>)}
              </div>
            </div></div>
            <div className="preview-footer"><span>{blocks.length} جزء در صفحه</span><span>تغییرات در پیش‌نمایش نمایش داده می‌شود</span></div>
          </section>
          <aside className="properties-panel"><div className="properties-head"><strong>تنظیمات جزء</strong><button onClick={removeSelected} disabled={selected === null} aria-label="حذف جزء"><Trash2 size={17} /></button></div>
            {blocks.find(b => b.id === selected) ? <><label>متن یا عنوان</label><textarea value={blocks.find(b => b.id === selected)!.text} onChange={e => changeText(selected!, e.target.value)} /><div className="property-actions"><button onClick={() => { const b = blocks.find(x => x.id === selected); if (b) addBlock(b.type, b.label); }}><Copy size={15} /> کپی جزء</button></div></> : <div className="panel-empty">برای ویرایش، یک جزء را از پیش‌نمایش انتخاب کنید.</div>}
          </aside>
        </div>
        <footer className="editor-footer"><span className={saved ? "saved" : ""}>{saved ? "ذخیره شد" : "تغییرات ذخیره نشده"}</span><button onClick={save}><Save size={16} /> ذخیره پروژه</button></footer>
      </section>}
    </main>
  );
}
export default App;
