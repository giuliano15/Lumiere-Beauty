import { useEffect, useMemo, useState } from "react";
import { apiFetch, uploadFiles } from "../lib/api";

const initialForm = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  shortDesc: "",
  price: "",
  promoPrice: "",
  stock: 0,
  brand: "",
  categoryId: "",
  isActive: true,
  isFeatured: false,
  imagesText: "",
};

function buildImages(imagesText) {
  return imagesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url, index) => ({
      url,
      alt: `Imagem ${index + 1}`,
      sortOrder: index,
      isPrimary: index === 0,
    }));
}

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categories]);

  async function loadCategories() {
    const data = await apiFetch("/admin/categories");
    setCategories(data);
  }

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (selectedCategory) query.set("categoryId", selectedCategory);
      const data = await apiFetch(`/admin/products?${query.toString()}`);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, selectedCategory]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        sku: form.sku || null,
        description: form.description || null,
        shortDesc: form.shortDesc || null,
        price: Number(form.price),
        promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
        stock: Number(form.stock),
        brand: form.brand || null,
        categoryId: form.categoryId,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        images: buildImages(form.imagesText),
      };

      if (editingId) {
        await apiFetch(`/admin/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setForm(initialForm);
      setEditingId("");
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      slug: item.slug || "",
      sku: item.sku || "",
      description: item.description || "",
      shortDesc: item.shortDesc || "",
      price: item.price || "",
      promoPrice: item.promoPrice || "",
      stock: item.stock ?? 0,
      brand: item.brand || "",
      categoryId: item.categoryId || "",
      isActive: item.isActive ?? true,
      isFeatured: item.isFeatured ?? false,
      imagesText: (item.images || []).map((img) => img.url).join("\n"),
    });
  }

  async function removeProduct(id) {
    if (!window.confirm("Remover produto?")) return;
    try {
      await apiFetch(`/admin/products/${id}`, { method: "DELETE" });
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUploadImages(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadFiles(files);
      const current = form.imagesText.trim();
      const merged = [...(current ? current.split("\n").filter(Boolean) : []), ...result.urls];
      setForm((prev) => ({ ...prev, imagesText: merged.join("\n") }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <section className="page-grid">
      <div className="card">
        <h2>{editingId ? "Editar produto" : "Novo produto"}</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Nome<input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></label>
          <label>Slug<input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} required /></label>
          <label>SKU<input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} /></label>
          <label>Categoria
            <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} required>
              <option value="">Selecione</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </label>
          <label>Preco<input type="number" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required /></label>
          <label>Preco promocional<input type="number" step="0.01" value={form.promoPrice} onChange={(e) => setForm((p) => ({ ...p, promoPrice: e.target.value }))} /></label>
          <label>Estoque<input type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} required /></label>
          <label>Marca<input value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} /></label>
          <label>Descricao curta<input value={form.shortDesc} onChange={(e) => setForm((p) => ({ ...p, shortDesc: e.target.value }))} /></label>
          <label>Descricao completa<textarea rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
          <label>
            Upload de imagens (otimizadas automaticamente)
            <input type="file" accept="image/*" multiple onChange={handleUploadImages} />
          </label>
          <label>
            Imagens (1 URL por linha)
            <textarea rows={4} value={form.imagesText} onChange={(e) => setForm((p) => ({ ...p, imagesText: e.target.value }))} />
            <small>{uploading ? "Enviando e comprimindo imagens..." : "As imagens sao convertidas para WebP e redimensionadas no servidor."}</small>
          </label>
          <label className="check-row"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} /> Ativo</label>
          <label className="check-row"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))} /> Destaque</label>
          <div className="actions-row">
            <button className="btn primary" type="submit">{editingId ? "Salvar" : "Criar produto"}</button>
            {editingId ? <button className="btn" type="button" onClick={() => { setEditingId(""); setForm(initialForm); }}>Cancelar</button> : null}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Produtos</h2>
        <div className="actions-row">
          <input placeholder="Buscar por nome" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">Todas categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        {loading ? <p>Carregando...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        <div className="list-wrap">
          {products.map((item) => (
            <article key={item.id} className="list-item">
              <div>
                <strong>{item.name}</strong>
                <p>
                  {categoryMap.get(item.categoryId) || "Sem categoria"} | R$ {item.price} | estoque: {item.stock}
                </p>
              </div>
              <div className="actions-row">
                <button className="btn" onClick={() => startEdit(item)}>Editar</button>
                <button className="btn danger" onClick={() => removeProduct(item.id)}>Excluir</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
