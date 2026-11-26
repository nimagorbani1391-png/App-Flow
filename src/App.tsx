import { Plus } from "lucide-react";

function App() {
  return (
    <main className="app-shell" dir="rtl">
      <header className="brand-header">
        <h1 className="brand-title">اپ فلو</h1>
      </header>
      <nav className="top-navigation" aria-label="ناوبری اصلی">
        <div className="nav-item">تنظیمات</div>
        <div className="nav-item active">پروژه‌ها</div>
      </nav>
      <section className="workspace">
        <div className="create-card">
          <span className="create-icon"><Plus size={25} strokeWidth={1.8} /></span>
          <strong>ساخت پروژه جدید</strong>
        </div>
      </section>
    </main>
  );
}

export default App;
