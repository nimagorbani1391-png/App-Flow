import { useState } from "react";
import { Plus, FolderKanban, Settings2, FolderOpen, Menu, X, GraduationCap, ArrowLeft, Save, Type, MousePointer2, FormInput, Trash2, Smartphone, ChevronDown } from "lucide-react";

type ElementType = "text" | "button" | "input";
type ElementItem = { id: number; type: ElementType; text: string };

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [projectName, setProjectName] = useState("پروژه جدید");
  const [elements, setElements] = useState<ElementItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const addElement = (type: ElementType) => {
    const labels = { text: "متن جدید", button: "دکمه جدید", input: "کادر ورودی" };
    const element = { id: Date.now(), type, text: labels[type] };
    setElements(current => [...current, element]);
    setSelectedId(element.id);
    setAddMenuOpen(false);
    setSaved(false);
  };

  const updateElement = (text: string) => {
    setElements(current => current.map(item => item.id === selectedId ? { ...item, text } : item));
    setSaved(false);
  };

  const deleteElement = () => {
    if (selectedId === null) return;
    setElements(current => current.filter(item => item.id !== selectedId));
    setSelectedId(null);
    setSaved(false);
  };

  const saveProject = () => {
    const savedProjects = JSON.parse(localStorage.getItem("appflow-projects") || "[]");
    const project = { id: "current", name: projectName, elements };
    const others = savedProjects.filter((item: { id: string }) => item.id !== "current");
    localStorage.setItem("appflow-projects", JSON.stringify([...others, project]));
    setSaved(true);
  };

  const selectedElement = elements.find(item => item.id === selectedId);

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
            <button className="menu-item" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}><Settings2 size={19} /><span>تنظیمات</span></button>
            <a className="menu-item" href="https://rubika.ir/App_Flow" target="_blank" rel="noopener noreferrer" tabIndex={menuOpen ? 0 : -1}><GraduationCap size={19} /><span>آموزش‌ها</span></a>
          </nav>
        </header>
        <div className="app-layout">
          <section className="workspace">
            <div className="page-heading">
              <div><h2>پروژه‌های من</h2><p>پروژه‌هایت را اینجا مدیریت کن.</p></div>
              <span className="project-count"><FolderKanban size={17} /> ۰ پروژه</span>
            </div>
            <button className="create-card" type="button" onClick={() => { setElements([]); setSelectedId(null); setProjectName("پروژه جدید"); setEditorOpen(true); }}>
              <span className="create-icon"><Plus size={23} strokeWidth={2.2} /></span>
              <span className="create-copy"><strong>ساخت پروژه جدید</strong><span>یک پروژه تازه ایجاد کن</span></span>
            </button>
            <section className="projects-list" aria-label="لیست پروژه‌ها">
              <div className="projects-list-heading">
                <div className="projects-list-title"><FolderKanban size={19} /><h3>لیست پروژه‌ها</h3></div>
                <span className="projects-list-total">۰ پروژه</span>
              </div>
              <div className="projects-list-empty"><FolderOpen size={25} strokeWidth={1.7} /><span>هنوز پروژه‌ای ایجاد نشده است.</span></div>
            </section>
          </section>
        </div>
      </> : <section className="simple-editor">
        <header className="simple-editor-header">
          <button className="simple-back" aria-label="بازگشت" onClick={() => setEditorOpen(false)}><ArrowLeft size={22} /></button>
          <input className="simple-project-name" aria-label="نام پروژه" value={projectName} onChange={event => { setProjectName(event.target.value); setSaved(false); }} />
          <button className="simple-save" onClick={saveProject}><Save size={18} /><span>ذخیره</span></button>
        </header>

        <div className="simple-editor-layout">
          <aside className="simple-tools">
            <div className="simple-section-title">ابزارهای صفحه</div>
            <button className="simple-add-main" onClick={() => setAddMenuOpen(!addMenuOpen)}><Plus size={19} /> افزودن عنصر <ChevronDown size={16} /></button>
            {addMenuOpen && <div className="simple-add-options">
              <button onClick={() => addElement("text")}><Type size={18} /> افزودن متن</button>
              <button onClick={() => addElement("button")}><MousePointer2 size={18} /> افزودن دکمه</button>
              <button onClick={() => addElement("input")}><FormInput size={18} /> افزودن کادر ورودی</button>
            </div>}
            <div className="simple-tools-hint">عنصر موردنظر را اضافه کن تا در پیش‌نمایش نمایش داده شود.</div>
          </aside>

          <section className="simple-preview">
            <div className="simple-preview-heading"><span><Smartphone size={17} /> پیش‌نمایش برنامه</span><span className="simple-live">زنده</span></div>
            <div className="simple-phone">
              <div className="simple-phone-status"><span>۹:۴۱</span><span>● ● ●</span></div>
              <div className="simple-phone-title">{projectName || "پروژه جدید"}</div>
              <div className="simple-phone-content">
                {elements.length === 0 ? <div className="simple-empty"><Plus size={27} /><strong>صفحه هنوز خالی است</strong><span>از قسمت ابزارها یک عنصر اضافه کن.</span></div> :
                  elements.map(element => <div key={element.id} className={`simple-element ${selectedId === element.id ? "is-selected" : ""}`} onClick={() => setSelectedId(element.id)}>
                    {element.type === "button" ? <button className="simple-preview-button">{element.text}</button> :
                     element.type === "input" ? <div className="simple-preview-input">{element.text}</div> :
                     <div className="simple-preview-text">{element.text}</div>}
                  </div>)}
              </div>
            </div>
            <div className="simple-preview-foot">{elements.length} عنصر در صفحه</div>
          </section>

          <aside className="simple-properties">
            <div className="simple-section-title">ویرایش عنصر</div>
            {selectedElement ? <>
              <label htmlFor="element-text">متن عنصر انتخاب‌شده</label>
              <textarea id="element-text" value={selectedElement.text} onChange={event => updateElement(event.target.value)} />
              <button className="simple-delete" onClick={deleteElement}><Trash2 size={17} /> حذف عنصر</button>
            </> : <div className="simple-property-empty">برای ویرایش یا حذف، یک عنصر را در پیش‌نمایش انتخاب کن.</div>}
            {saved && <div className="simple-saved">پروژه با موفقیت ذخیره شد.</div>}
          </aside>
        </div>
        <footer className="simple-editor-footer"><span>{saved ? "تغییرات ذخیره شد" : "پیش‌نمایش با تغییرات به‌روز می‌شود"}</span><button onClick={saveProject}><Save size={16} /> ذخیره پروژه</button></footer>
      </section>}
    </main>
  );
}

export default App;
