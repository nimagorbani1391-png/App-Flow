import { FolderKanban, Settings2, Plus, ArrowLeft } from "lucide-react";

function App() {
  return (
    <main className="home-page" dir="rtl">
      <div className="home-content">
        <section className="quick-panel" aria-label="دسترسی‌های اصلی">
          <div className="quick-item">
            <span className="quick-icon projects-icon"><FolderKanban size={23} /></span>
            <span className="quick-label">
              <strong>مدیریت پروژه‌ها</strong>
              <small>مشاهده و مدیریت پروژه‌ها</small>
            </span>
            <ArrowLeft className="item-arrow" size={21} />
          </div>
          <div className="panel-divider" />
          <div className="quick-item">
            <span className="quick-icon settings-icon"><Settings2 size={23} /></span>
            <span className="quick-label">
              <strong>تنظیمات</strong>
              <small>تنظیمات فضای کاری</small>
            </span>
            <ArrowLeft className="item-arrow" size={21} />
          </div>
        </section>

        <section className="create-section">
          <div className="create-card">
            <span className="create-icon"><Plus size={27} strokeWidth={2} /></span>
            <span className="create-copy">
              <strong>ساخت پروژه جدید</strong>
              <small>شروع ساخت یک اپلیکیشن تازه</small>
            </span>
            <ArrowLeft className="create-arrow" size={21} />
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
