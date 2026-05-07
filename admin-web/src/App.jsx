import { useMemo, useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { ProductsPage } from "./pages/ProductsPage";
import { HomeSectionsPage } from "./pages/HomeSectionsPage";
import { SettingsPage } from "./pages/SettingsPage";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const NAV_MENU = [
  { id: "products",  label: "Produtos",       icon: "🛍️", section: "Catálogo" },
  { id: "categories",label: "Categorias",     icon: "🏷️", section: "Catálogo" },
  { id: "sections-launches",  label: "Lancamentos",  icon: "🚀", section: "Vitrine" },
  { id: "sections-highlights",label: "Destaques",    icon: "⭐", section: "Vitrine" },
  { id: "sections",  label: "Outras Secoes Home",  icon: "🏠", section: "Vitrine" },
  { id: "settings",  label: "Configurações",  icon: "⚙️", section: "Sistema" },
];

export function App() {
  const [user, setUser] = useState(getStoredUser());
  const [currentTab, setCurrentTab] = useState("products");

  if (!user) return <LoginPage onSuccess={setUser} />;

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setUser(null);
  }

  // Group menu items by section
  const sections = useMemo(() => {
    const map = new Map();
    NAV_MENU.forEach((item) => {
      if (!map.has(item.section)) map.set(item.section, []);
      map.get(item.section).push(item);
    });
    return map;
  }, []);

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">💄</div>
          <div>
            <div className="sidebar-logo-text">Lumiere Admin</div>
            <div className="sidebar-logo-sub">Painel Administrativo</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {Array.from(sections.entries()).map(([sectionLabel, items]) => (
            <div key={sectionLabel}>
              <div className="nav-section-label">{sectionLabel}</div>
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`menu-btn ${currentTab === item.id ? "active" : ""}`}
                  onClick={() => setCurrentTab(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn ghost sm full" onClick={logout}>
            🚪 Sair
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="content">
        <header className="topbar">
          <div>
            <strong>{user.name}</strong>
            <p>{user.email}</p>
          </div>
          <button className="btn ghost sm" onClick={logout}>Sair</button>
        </header>

        <div className="page-content">
          {currentTab === "products" ? <ProductsPage /> : null}
          {currentTab === "categories" ? <CategoriesPage /> : null}
          {currentTab === "sections-launches" ? (
            <HomeSectionsPage fixedType="LANCAMENTOS" title="Gestao de Lancamentos" />
          ) : null}
          {currentTab === "sections-highlights" ? (
            <HomeSectionsPage fixedType="DESTAQUES" title="Gestao de Destaques" />
          ) : null}
          {currentTab === "sections" ? <HomeSectionsPage title="Gestao de secoes da Home" /> : null}
          {currentTab === "settings" ? <SettingsPage /> : null}
        </div>
      </main>
    </div>
  );
}
