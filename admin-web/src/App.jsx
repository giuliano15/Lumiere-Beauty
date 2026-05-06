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

export function App() {
  const [user, setUser] = useState(getStoredUser());
  const [currentTab, setCurrentTab] = useState("categories");

  const menu = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard" },
      { id: "categories", label: "Categorias" },
      { id: "products", label: "Produtos (proxima etapa)" },
      { id: "sections", label: "Home Sections (proxima etapa)" },
      { id: "settings", label: "Configuracoes (proxima etapa)" },
    ],
    [],
  );

  if (!user) return <LoginPage onSuccess={setUser} />;

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setUser(null);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Lumiere Admin</h2>
        <nav>
          {menu.map((item) => (
            <button
              key={item.id}
              className={`menu-btn ${currentTab === item.id ? "active" : ""}`}
              onClick={() => setCurrentTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <strong>{user.name}</strong>
            <p>{user.email}</p>
          </div>
          <button className="btn" onClick={logout}>Sair</button>
        </header>

        {currentTab === "dashboard" ? <section className="card"><h2>Dashboard</h2><p>Painel pronto. Proximo passo: produtos.</p></section> : null}
        {currentTab === "categories" ? <CategoriesPage /> : null}
      {currentTab === "products" ? <ProductsPage /> : null}
      {currentTab === "sections" ? <HomeSectionsPage /> : null}
      {currentTab === "settings" ? <SettingsPage /> : null}
      </main>
    </div>
  );
}
