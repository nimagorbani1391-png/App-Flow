import { Plus, FolderKanban, Settings2, ArrowLeft, Layers3, PanelsTopLeft, Smartphone, Sparkles, Clock3, LayoutDashboard, WandSparkles, MonitorSmartphone, CircleHelp } from "lucide-react";

function App() {
  return (
    <main className="app-shell" dir="rtl">
      <header className="brand-header">
        <div className="brand-lockup">
          <span className="brand-mark"><Layers3 size={22} strokeWidth={2.2} /></span>
          <h1 className="brand-title">اپ فلو</h1>
        </div>
        <span className="header-decoration"><Sparkles size={16} /></span>
      </header>

      <nav className="top-navigation" aria-label="ناوبری اصلی">
        <div className="nav-item"><Settings2 size={19} strokeWidth={1.9} /><span>تنظیمات</span></div>
        <div className="nav-item active"><FolderKanban size={19} strokeWidth={1.9} /><span>پروژه‌ها</span></div>
      </nav>

      <section className="workspace">
        <div className="welcome-row">
          <div>
            <span className="eyebrow"><LayoutDashboard size={14} /> فضای کاری</span>
            <h2 className="section-title">همه‌چیز برای ساخت آماده است</h2>
            <p className="section-subtitle">ایده‌هایت را به تجربه‌های دیجیتال تبدیل کن.</p>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <div className="art-core"><WandSparkles size={27} /></div>
          </div>
        </div>

        <div className="create-card">
          <span className="create-icon"><Plus size={25} strokeWidth={2} /></span>
          <div className="create-copy"><strong>ساخت پروژه جدید</strong><span>شروع یک تجربه تازه از همین‌جا</span></div>
          <span className="create-arrow"><ArrowLeft size={19} /></span>
        </div>

        <section className="quick-section" aria-label="بخش‌های اپ فلو">
          <div className="section-heading">
            <div><h3>دنیای ساخت اپلیکیشن</h3><p>ابزارهایی برای شکل‌دادن به ایده‌ها</p></div>
            <span className="heading-spark"><Sparkles size={17} /></span>
          </div>
          <div className="feature-grid">
            <div className="feature-card feature-red">
              <span className="feature-icon"><PanelsTopLeft size={21} /></span>
              <strong>طراحی بصری</strong><span className="feature-caption">چیدمان و ظاهر</span>
              <span className="feature-watermark"><PanelsTopLeft size={58} /></span>
            </div>
            <div className="feature-card feature-dark">
              <span className="feature-icon"><Layers3 size={21} /></span>
              <strong>اجزای رابط</strong><span className="feature-caption">ساختار و عناصر</span>
              <span className="feature-watermark"><Layers3 size={58} /></span>
            </div>
            <div className="feature-card feature-light">
              <span className="feature-icon"><Smartphone size={21} /></span>
              <strong>نمایش چنداندازه</strong><span className="feature-caption">موبایل و دسکتاپ</span>
              <span className="feature-watermark"><MonitorSmartphone size={58} /></span>
            </div>
          </div>
        </section>

        <section className="activity-section">
          <div className="section-heading activity-heading">
            <div><h3>فعالیت‌های اخیر</h3><p>مروری بر آخرین تغییرات فضای کاری</p></div>
            <span className="activity-icon"><Clock3 size={18} /></span>
          </div>
          <div className="empty-activity">
            <span className="empty-icon"><FolderKanban size={24} /></span>
            <strong>هنوز فعالیتی وجود ندارد</strong>
            <span>بعد از شروع کار، فعالیت‌ها اینجا نمایش داده می‌شوند.</span>
          </div>
        </section>

        <footer className="workspace-footer">
          <span><span className="footer-dot" /> اپ فلو، فضای ساخت ایده‌ها</span>
          <span className="footer-help"><CircleHelp size={15} /> همراه مسیر ساخت</span>
        </footer>
      </section>
    </main>
  );
}

export default App;