import { FolderKanban, Settings2, Plus, Layers3 } from "lucide-react";

function App() {
  return (
    <main className="home-page" dir="rtl">
      <header className="home-header">
        <div className="brand">
          <div className="brand-mark"><Layers3 size={21} strokeWidth={2.2} /></div>
          <div className="brand-copy"><strong>APP FLOW</strong><span>فضای ساخت اپلیکیشن</span></div>
        </div>
      </header>
      <section className="home-content">
        <div className="welcome">
          <span className="eyebrow">WORKSPACE</span>
          <h1>فضای کاری تو</h1>
          <p>پروژه‌هایت را مدیریت کن و ایده‌های تازه بساز.</p>
        </div>
        <section className="quick-panel" aria-label="دسترسی‌های اصلی">
          <button className="quick-item" type="button">
            <span className="quick-icon"><FolderKanban size={21} /></span>
            <span className="quick-label"><strong>مدیریت پروژه‌ها</strong><small>مشاهده و مدیریت پروژه‌ها</small></span>
            <span className="item-arrow">←</span>
          </button>
          <div className="panel-divider" />
          <button className="quick-item" type="button">
            <span className="quick-icon settings-icon"><Settings2 size={21} /></span>
            <span className="quick-label"><strong>تنظیمات</strong><small>تنظیمات فضای کاری</small></span>
            <span className="item-arrow">←</span>
          </button>
        </section>
        <section className="create-section">
          <div className="section-heading"><div><span className="eyebrow">GET STARTED</span><h2>شروع یک ایده تازه</h2></div></div>
          <button className="create-card" type="button">
            <span className="create-icon"><Plus size={27} strokeWidth={1.8} /></span>
            <span className="create-copy"><strong>ساخت پروژه جدید</strong><small>یک فضای تازه برای ساخت اپلیکیشن ایجاد کن</small></span>
            <span className="create-arrow">←</span>
          </button>
        </section>
      </section>
      <footer className="home-footer"><span>APP FLOW</span><span>فضای ساخت و خلاقیت</span></footer>
    </main>
  );
}
export default App;
