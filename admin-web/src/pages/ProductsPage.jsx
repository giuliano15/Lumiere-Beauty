import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, uploadFiles } from "../lib/api";

const EMPTY_FORM = {
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
  images: ["", "", "", "", ""],
};

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildImages(imagesArray) {
  return imagesArray
    .map((url) => url?.trim())
    .filter(Boolean)
    .map((url, i) => ({ url, alt: `Imagem ${i + 1}`, sortOrder: i, isPrimary: i === 0 }));
}

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
}

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div
      id="adm-toast"
      className={`show ${type === "error" ? "error" : ""}`}
      style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 999 }}
    >
      {type === "error" ? "⚠️" : "✅"} {message}
    </div>
  );
}

export function ProductsPage() {
  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [search, setSearch]           = useState("");
  const [catFilter, setCatFilter]     = useState("");
  const [form, setForm]               = useState(EMPTY_FORM);
  const [editingId, setEditingId]     = useState("");
  const [loading, setLoading]         = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [zoomImage, setZoomImage]     = useState(null); // Estado para o Lightbox
  const [error, setError]             = useState("");
  const [toast, setToast]             = useState({ message: "", type: "success" });
  const [previewUrl, setPreviewUrl]   = useState("");
  const fileInputRef                  = useRef(null);

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3500);
  }

  async function loadCategories() {
    try {
      const data = await apiFetch("/admin/categories");
      setCategories(data);
    } catch {
      // silencioso
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams();
      if (search.trim()) q.set("search", search.trim());
      if (catFilter) q.set("categoryId", catFilter);
      const data = await apiFetch(`/admin/products?${q}`);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadProducts(); }, [search, catFilter]);

  function openModal(item = null) {
    setError("");
    if (item) {
      setEditingId(item.id);
      const firstImg = (item.images || [])[0]?.url || "";
      setPreviewUrl(firstImg);
      setForm({
        name:        item.name        || "",
        slug:        item.slug        || "",
        sku:         item.sku         || "",
        description: item.description || "",
        shortDesc:   item.shortDesc   || "",
        price:       item.price       || "",
        promoPrice:  item.promoPrice  || "",
        stock:       item.stock       ?? 0,
        brand:       item.brand       || "",
        categoryId:  item.categoryId  || "",
        isActive:    item.isActive    ?? true,
        isFeatured:  item.isFeatured  ?? false,
        images:      (() => {
          const arr = ["", "", "", "", ""];
          (item.images || []).forEach((img, i) => { if(i < 5) arr[i] = img.url; });
          return arr;
        })(),
      });
    } else {
      setEditingId("");
      setPreviewUrl("");
      setForm(EMPTY_FORM);
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId("");
    setPreviewUrl("");
    setForm(EMPTY_FORM);
    setError("");
  }

  function setField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-gera slug pelo nome (somente criação)
      if (key === "name" && !editingId) next.slug = slugify(value);
      return next;
    });
  }

  async function handleUpload(event, index = 0) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError("");
    try {
      const result = await uploadFiles(files);
      const nextImages = [...form.images];
      
      // Se for upload múltiplo no primeiro slot, tenta preencher os seguintes
      result.urls.forEach((url, i) => {
        if (index + i < 5) nextImages[index + i] = url;
      });

      setField("images", nextImages);
      if (result.urls[0]) setPreviewUrl(result.urls[0]);
      showToast("Imagens enviadas com sucesso!");
    } catch (err) {
      setError(`Erro no upload: ${err.message}`);
      showToast(`Erro: ${err.message}`, "error");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }


  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    if (!form.name.trim()) { setError("Nome é obrigatório."); return; }
    if (!form.price)       { setError("Preço é obrigatório."); return; }
    if (!form.categoryId)  { setError("Selecione uma categoria."); return; }

    try {
      setSubmitting(true);
      const payload = {
        name:        form.name.trim(),
        slug:        form.slug.trim() || slugify(form.name),
        sku:         form.sku   || null,
        description: form.description || null,
        shortDesc:   form.shortDesc   || null,
        price:       Number(form.price),
        promoPrice:  form.promoPrice ? Number(form.promoPrice) : null,
        stock:       Number(form.stock),
        brand:       form.brand || null,
        categoryId:  form.categoryId,
        isActive:    form.isActive,
        isFeatured:  form.isFeatured,
        images:      buildImages(form.images),
      };

      if (editingId) {
        await apiFetch(`/admin/products/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("Produto atualizado com sucesso! ✨");
      } else {
        await apiFetch("/admin/products", { method: "POST", body: JSON.stringify(payload) });
        showToast("Produto criado com sucesso! 🎉");
      }

      closeModal();
      await loadProducts();
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Remover "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await apiFetch(`/admin/products/${id}`, { method: "DELETE" });
      showToast("Produto removido.");
      await loadProducts();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const firstImgUrl = form.images[0] || "";

  return (
    <>
      {/* ── Toast ── */}
      <Toast message={toast.message} type={toast.type} />

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <div className="page-header-title">🛍️ Produtos</div>
          <div className="page-header-sub">Gerencie o catálogo da sua loja</div>
        </div>
        <button className="btn primary" onClick={() => openModal()}>
          ✨ Novo Produto
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="search-row">
          <input
            placeholder="🔍  Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Category filter tabs */}
        {categories.length > 0 && (
          <div className="filter-tabs">
            <button
              className={`filter-tab ${catFilter === "" ? "active" : ""}`}
              onClick={() => setCatFilter("")}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`filter-tab ${catFilter === c.id ? "active" : ""}`}
                onClick={() => setCatFilter(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Product list ── */}
      <div className="card">
        <h2>
          📦 Produtos cadastrados
          <span style={{ marginLeft: "auto", fontSize: "0.8rem", fontWeight: 500, color: "var(--adm-muted)", fontFamily: "Inter" }}>
            {products.length} {products.length === 1 ? "item" : "itens"}
          </span>
        </h2>

        {error && <p className="error-text" style={{ marginBottom: "1rem" }}>{error}</p>}

        {loading ? (
          <div className="empty-state">
            <span className="empty-icon">⏳</span>
            Carregando produtos...
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🛍️</span>
            Nenhum produto encontrado.
            <br />
            <button className="btn primary sm" style={{ marginTop: "1rem" }} onClick={() => openModal()}>
              + Criar primeiro produto
            </button>
          </div>
        ) : (
          <div className="list-wrap">
            {products.map((item) => {
              const img = item.images?.[0]?.url;
              const cat = categoryMap.get(item.categoryId);
              return (
                <div key={item.id} className="list-item">
                  {img ? (
                    <img
                      className="list-item-img"
                      src={img}
                      alt={item.name}
                      onClick={() => setZoomImage(img)}
                      style={{ cursor: "zoom-in" }}
                      title="Clique para ampliar"
                    />
                  ) : (
                    <div className="list-item-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                      🖼️
                    </div>
                  )}

                  <div className="list-item-info">
                    <strong>{item.name}</strong>
                    <p>
                      {cat?.name || "Sem categoria"} &nbsp;·&nbsp;
                      {formatBRL(item.price)}
                      {item.promoPrice ? <span style={{ color: "var(--adm-accent)", marginLeft: "0.4rem" }}>{formatBRL(item.promoPrice)}</span> : null}
                      &nbsp;·&nbsp; Estoque: {item.stock}
                    </p>
                    <p style={{ marginTop: "0.3rem" }}>
                      <span className={`badge-status ${item.isActive ? "active" : "inactive"}`}>
                        {item.isActive ? "✔ Ativo" : "✖ Inativo"}
                      </span>
                      {item.isFeatured && (
                        <span style={{ marginLeft: "0.4rem", fontSize: "0.7rem", background: "rgba(199,0,151,0.1)", color: "var(--adm-accent)", borderRadius: "999px", padding: "0.15rem 0.5rem", fontWeight: 700 }}>
                          ⭐ Destaque
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="list-item-actions">
                    <button className="btn ghost sm" onClick={() => openModal(item)}>✏️ Editar</button>
                    <button className="btn danger sm" onClick={() => handleDelete(item.id, item.name)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <div className={`modal-overlay ${modalOpen ? "" : "hidden"}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal-box">
          <div className="modal-title">
            <span>{editingId ? "✏️ Editar produto" : "✨ Novo produto"}</span>
            <button className="btn ghost sm" onClick={closeModal} type="button">✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            {submitting ? (
              <div className="submit-progress">
                <span className="submit-progress-dot" />
                Salvando produto, aguarde...
              </div>
            ) : null}
            {error && (
              <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "0.65rem", padding: "0.75rem 1rem", marginBottom: "1rem", color: "var(--adm-danger)", fontSize: "0.85rem" }}>
                ⚠️ {error}
              </div>
            )}

            {/* ── Image slots ── */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--adm-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.8rem" }}>
                Fotos do produto (Máx 5)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
                {form.images.map((url, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <div 
                      className="img-upload-slot" 
                      onClick={() => document.getElementById(`file-input-${i}`).click()}
                      style={{ 
                        aspectRatio: "1", 
                        border: "2px dashed var(--adm-border)", 
                        borderRadius: "0.75rem", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        cursor: "pointer",
                        overflow: "hidden",
                        background: "#fafafa",
                        position: "relative"
                      }}
                    >
                      {url ? (
                        <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={`Slot ${i+1}`} />
                      ) : (
                        <div style={{ textAlign: "center", color: "#999" }}>
                          <span style={{ fontSize: "1.2rem", display: "block" }}>+</span>
                          <span style={{ fontSize: "0.6rem" }}>Slot {i+1}</span>
                        </div>
                      )}
                      {uploading && i === 0 && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>
                          ⏳
                        </div>
                      )}
                    </div>
                    <input 
                      id={`file-input-${i}`}
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleUpload(e, i)} 
                      style={{ display: "none" }} 
                    />
                    <input 
                      value={url} 
                      onChange={(e) => {
                        const next = [...form.images];
                        next[i] = e.target.value;
                        setField("images", next);
                      }}
                      placeholder={`URL ${i+1}`}
                      style={{ fontSize: "0.7rem", padding: "0.4rem", minHeight: "30px", textAlign: "center" }}
                    />
                  </div>
                ))}
              </div>
              <small style={{ marginTop: "0.5rem", display: "block", color: "var(--adm-muted)" }}>
                A primeira foto será a principal. Você pode clicar no slot para subir um arquivo ou colar a URL diretamente.
              </small>
            </div>

            {/* ── Name + Slug ── */}
            <div className="form-grid-2" style={{ marginBottom: "1rem" }}>
              <label>
                Nome do produto *
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Ex: Base Velvet Glow"
                  required
                />
              </label>
              <label>
                Slug (Identificador na URL)
                <input
                  value={form.slug}
                  onChange={(e) => setField("slug", e.target.value)}
                  placeholder="base-velvet-glow"
                />
              </label>
            </div>

            {/* ── Category + SKU ── */}
            <div className="form-grid-2" style={{ marginBottom: "1rem" }}>
              <label>
                Categoria *
                <select value={form.categoryId} onChange={(e) => setField("categoryId", e.target.value)} required>
                  <option value="">Selecione uma categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label>
                SKU
                <input
                  value={form.sku}
                  onChange={(e) => setField("sku", e.target.value)}
                  placeholder="Ex: BASE-VG-001"
                />
              </label>
            </div>

            {/* ── Prices + Stock + Brand ── */}
            <div className="form-grid-2" style={{ marginBottom: "1rem" }}>
              <label>
                Preço (R$) *
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  placeholder="0,00"
                  required
                />
              </label>
              <label>
                Preço promocional (R$)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.promoPrice}
                  onChange={(e) => setField("promoPrice", e.target.value)}
                  placeholder="0,00 (opcional)"
                />
              </label>
              <label>
                Estoque
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setField("stock", e.target.value)}
                />
              </label>
              <label>
                Marca
                <input
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                  placeholder="Ex: Lumiere"
                />
              </label>
            </div>

            {/* ── Descriptions ── */}
            <label style={{ marginBottom: "1rem" }}>
              Descrição curta
              <input
                value={form.shortDesc}
                onChange={(e) => setField("shortDesc", e.target.value)}
                placeholder="Resumo rápido do produto"
              />
            </label>
            <label style={{ marginBottom: "1rem" }}>
              Descrição completa
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Descreva benefícios, ingredientes, modo de uso..."
              />
            </label>


            {/* ── Toggles ── */}
            <div className="form-grid-2" style={{ marginBottom: "0.5rem" }}>
              <label className="check-row" style={{ flexDirection: "row", textTransform: "none", letterSpacing: 0, fontWeight: 500, color: "var(--adm-text)", fontSize: "0.88rem" }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                />
                Produto ativo na loja
              </label>
              <label className="check-row" style={{ flexDirection: "row", textTransform: "none", letterSpacing: 0, fontWeight: 500, color: "var(--adm-text)", fontSize: "0.88rem" }}>
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setField("isFeatured", e.target.checked)}
                />
                ⭐ Produto em destaque
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={closeModal} disabled={submitting}>
                Cancelar
              </button>
              <button type="submit" className="btn primary" disabled={submitting || uploading}>
                {submitting ? "⏳ Salvando..." : editingId ? "💾 Salvar alterações" : "✨ Criar produto"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Lightbox (Zoom da Imagem) ── */}
      {zoomImage && (
        <div
          className="modal-overlay"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}
          onClick={() => setZoomImage(null)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button
              className="btn ghost sm"
              style={{ position: "absolute", top: "-40px", right: "0", color: "white", borderColor: "rgba(255,255,255,0.3)", background: "rgba(0,0,0,0.5)" }}
              onClick={() => setZoomImage(null)}
            >
              FECHAR ✕
            </button>
            <img
              src={zoomImage}
              alt="Zoom"
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "1rem", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
