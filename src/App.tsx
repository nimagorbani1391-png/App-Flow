import { Plus, FolderKanban, Settings2, ArrowLeft } from "lucide-react";

function App() {
  return (
    <main className="app-shell" dir="rtl">
      <header className="brand-header">
        <h1 className="brand-title">اپ فلو</h1>
      </header>

      <nav className="top-navigation" aria-label="ناوبری اصلی">
        <div className="nav-item">
          <Settings2 size={19} strokeWidth={1.9} />
          <span>تنظیمات</span>
        </div>
        <div className="nav-item active">
          <FolderKanban size={19} strokeWidth={1.9} />
          <span>پروژه‌ها</span>
        </div>
      </nav>

      <section className="workspace">
        <div className="create-card">
          <span className="create-icon"><Plus size={25} strokeWidth={2} /></span>
          <strong>ساخت پروژه جدید</strong>
          <span className="create-arrow"><ArrowLeft size={19} /></span>
        </div>
      </section>
    </main>
  );
}

export default App;
