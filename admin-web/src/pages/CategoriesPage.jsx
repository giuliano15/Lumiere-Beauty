import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const initialForm = { name: "", slug: "", description: "", sortOrder: 0, isActive: true };

export function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/admin/categories");
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      if (editingId) {
        await apiFetch(`/admin/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
        });
      } else {
        await apiFetch("/admin/categories", {
          method: "POST",
          body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
        });
      }
      setForm(initialForm);
      setEditingId("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      slug: item.slug || "",
      description: item.description || "",
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive ?? true,
    });
  }

  async function removeCategory(id) {
    if (!window.confirm("Remover categoria?")) return;
    try {
      await apiFetch(`/admin/categories/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-grid">
      <div className="card">
        <h2>{editingId ? "Editar categoria" : "Nova categoria"}</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>Nome<input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required /></label>
          <label>Slug<input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} required /></label>
          <label>Descricao<input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></label>
          <label>Ordem<input type="number" value={form.sortOrder} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))} /></label>
          <label className="check-row"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} /> Ativa</label>
          <div className="actions-row">
            <button className="btn primary" type="submit">{editingId ? "Salvar" : "Criar categoria"}</button>
            {editingId ? <button className="btn" type="button" onClick={() => { setEditingId(""); setForm(initialForm); }}>Cancelar</button> : null}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Categorias</h2>
        {loading ? <p>Carregando...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        <div className="list-wrap">
          {categories.map((item) => (
            <article key={item.id} className="list-item">
              <div>
                <strong>{item.name}</strong>
                <p>{item.slug} | ordem: {item.sortOrder} | {item.isActive ? "ativa" : "inativa"}</p>
              </div>
              <div className="actions-row">
                <button className="btn" onClick={() => startEdit(item)}>Editar</button>
                <button className="btn danger" onClick={() => removeCategory(item.id)}>Excluir</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
