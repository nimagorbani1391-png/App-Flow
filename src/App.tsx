import { FolderKanban, Settings2, Plus, Layers3, Menu } from "lucide-react";

function App() {
  return (
    <main className="app-shell" dir="rtl">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-symbol"><Layers3 size={22} strokeWidth={2.2} /></span>
            <span className="brand-name">APP<span>FLOW</span></span>
          </div>
          <div className="header-caption">فضای ساخت اپلیکیشن</div>
          <span className="menu-mark"><Menu size={23} /></span>
        </div>
      </header>

      <nav className="top-navigation" aria-label="ناوبری اصلی">
        <div className="nav-item">
          <FolderKanban size={19} />
          <span>پروژه‌ها</span>
          <i className="nav-indicator" />
        </div>
        <div className="nav-item settings-tab">
          <Settings2 size={19} />
          <span>تنظیمات</span>
        </div>
      </nav>

      <section className="workspace">
        <div className="section-intro">
          <span className="section-kicker">WORKSPACE</span>
          <h1>فضای ساخت تو</h1>
          <p>ایده‌ات را به یک محصول واقعی تبدیل کن.</p>
        </div>

        <div className="create-card">
          <div className="create-symbol"><Plus size={27} strokeWidth={2.1} /></div>
          <div className="create-copy">
            <strong>ساخت پروژه جدید</strong>
            <span>یک پروژه تازه برای شروع طراحی بساز</span>
          </div>
          <span className="create-arrow">←</span>
        </div>
      </section>
    </main>
  );
}

export default App;
