import { Plus } from "lucide-react";

function App() {
  return (
    <main className="home-page" dir="rtl">
      <nav className="top-navigation" aria-label="ناوبری اصلی">
        <div className="nav-item">تنظیمات</div>
        <div className="nav-item">پروژه‌ها</div>
      </nav>

      <div className="home-content">
        <section className="create-section">
          <div className="create-card">
            <span className="create-icon"><Plus size={27} strokeWidth={2} /></span>
            <span className="create-copy">
              <strong>ساخت پروژه جدید</strong>
              <small>شروع ساخت یک اپلیکیشن تازه</small>
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
