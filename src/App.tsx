import { useState } from "react";
import { Plus, FolderKanban, Settings2, FolderOpen, Menu, X } from "lucide-react";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="app-shell" dir="rtl">
      <header className="brand-header">
        <button className="menu-toggle" type="button" aria-label={menuOpen ? "بستن منو" : "باز کردن منو"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={23} /> : <Menu size={24} />}
        </button>
        <h1 className="brand-title">اپ فلو</h1>
        <button className={`menu-backdrop ${menuOpen ? "visible" : ""}`} aria-label="بستن منو" aria-hidden={!menuOpen} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} />
        <nav className={`hamburger-menu ${menuOpen ? "open" : ""}`} aria-label="منوی اصلی" aria-hidden={!menuOpen}>
          <button className="menu-item active" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}><FolderKanban size={19} /><span>پروژه‌ها</span></button>
          <button className="menu-item" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}><Settings2 size={19} /><span>تنظیمات</span></button>
        </nav>
      </header>
      <div className="app-layout">
        <section className="workspace">
          <div className="page-heading">
            <div><h2>پروژه‌های من</h2><p>پروژه‌هایت را اینجا مدیریت کن.</p></div>
            <span className="project-count"><FolderKanban size={17} /> ۰ پروژه</span>
          </div>
          <div className="create-card">
            <span className="create-icon"><Plus size={23} strokeWidth={2.2} /></span>
            <div className="create-copy"><strong>ساخت پروژه جدید</strong><span>یک پروژه تازه ایجاد کن</span></div>
          </div>
          <div className="empty-state">
            <span className="empty-icon"><FolderOpen size={31} strokeWidth={1.6} /></span>
            <strong>هنوز پروژه‌ای نداری</strong>
            <span>با ساخت اولین پروژه، فضای کارت اینجا نمایش داده می‌شود.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
export default App;
