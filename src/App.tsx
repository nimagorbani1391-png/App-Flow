import { Plus, FolderKanban, Settings2, Layers3, FolderOpen } from "lucide-react";

function App() {
  return (
    <main className="app-shell" dir="rtl">
      <header className="brand-header">
        <div className="brand-lockup">
          <span className="brand-mark"><Layers3 size={21} strokeWidth={2.1} /></span>
          <h1 className="brand-title">اپ فلو</h1>
        </div>
      </header>

      <div className="app-layout">
        <nav className="side-navigation" aria-label="ناوبری اصلی">
          <div className="nav-item active"><FolderKanban size={19} /><span>پروژه‌ها</span></div>
          <div className="nav-item"><Settings2 size={19} /><span>تنظیمات</span></div>
        </nav>

        <section className="workspace">
          <div className="page-heading">
            <div>
              <h2>پروژه‌های من</h2>
              <p>پروژه‌هایت را اینجا مدیریت کن.</p>
            </div>
            <span className="project-count"><FolderKanban size={17} /> ۰ پروژه</span>
          </div>

          <div className="create-card">
            <span className="create-icon"><Plus size={23} strokeWidth={2.2} /></span>
            <div className="create-copy">
              <strong>ساخت پروژه جدید</strong>
              <span>یک پروژه تازه ایجاد کن</span>
            </div>
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
