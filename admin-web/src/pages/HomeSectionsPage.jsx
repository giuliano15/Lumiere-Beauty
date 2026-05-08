import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

const SECTION_OPTIONS = [
  { value: "HERO", label: "Banner Principal (Topo)" },
  { value: "LIVE", label: "Vitrine de Ofertas" },
  { value: "LANCAMENTOS", label: "Lançamentos" },
  { value: "DESTAQUES", label: "Destaques" },
];

export function HomeSectionsPage({ fixedType = "", title = "Home Sections" }) {
  const [products, setProducts] = useState([]);
  const [type, setType] = useState(fixedType || "HERO");
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchAvailable, setSearchAvailable] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selectedTypeLabel = SECTION_OPTIONS.find((opt) => opt.value === type)?.label || type;

  const selectedProducts = useMemo(
    () =>
      selectedIds
        .map((id) => productMap.get(id))
        .filter(Boolean),
    [selectedIds, productMap],
  );

  const availableProducts = useMemo(
    () => products.filter((product) => !selectedIds.includes(product.id)),
    [products, selectedIds],
  );

  const filteredAvailableProducts = useMemo(() => {
    const term = searchAvailable.trim().toLowerCase();
    if (!term) return availableProducts;
    return availableProducts.filter((product) => {
      const name = String(product.name || "").toLowerCase();
      const category = String(product.category?.name || "").toLowerCase();
      return name.includes(term) || category.includes(term);
    });
  }, [availableProducts, searchAvailable]);

  function getProductImage(product) {
    return (
      product?.images?.[0]?.url ||
      "https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=500"
    );
  }

  useEffect(() => {
    async function loadBase() {
      try {
        const data = await apiFetch("/admin/products");
        setProducts(data.filter((item) => item.isActive));
      } catch (err) {
        setError(err.message);
      }
    }
    loadBase();
  }, []);

  useEffect(() => {
    if (!fixedType) return;
    setType(fixedType);
  }, [fixedType]);

  useEffect(() => {
    async function loadSection() {
      setError("");
      setSuccess("");
      try {
        const data = await apiFetch("/admin/home-sections");
        const sectionItems = data
          .filter((item) => item.type === type && item.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => item.productId);
        setSelectedIds(sectionItems);
      } catch (err) {
        setError(err.message);
      }
    }
    loadSection();
  }, [type]);

  function addProduct(productId) {
    if (!productId) return;
    if (selectedIds.includes(productId)) return;
    setSelectedIds((prev) => [...prev, productId]);
  }

  function removeProduct(productId) {
    setSelectedIds((prev) => prev.filter((id) => id !== productId));
  }

  function move(productId, direction) {
    setSelectedIds((prev) => {
      const index = prev.indexOf(productId);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  }

  async function saveSection() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/admin/home-sections/${type}`, {
        method: "PUT",
        body: JSON.stringify({
          items: selectedIds.map((productId, index) => ({
            productId,
            sortOrder: index,
            isActive: true,
          })),
        }),
      });
      setSuccess("Secao salva com sucesso.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-grid">
      <div className="card">
        <div className="page-header">
          <div>
            <h2 className="page-header-title">{title}</h2>
            <p className="page-header-sub">Crie e edite os produtos da vitrine com ordem e controle total.</p>
          </div>
        </div>

        {!fixedType ? (
          <label>
            Secao
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {SECTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        ) : (
          <p className="page-header-sub">Secao atual: <strong>{selectedTypeLabel}</strong></p>
        )}

        <label>
          Adicionar produto na secao
          <select onChange={(e) => { addProduct(e.target.value); e.target.value = ""; }} defaultValue="">
            <option value="">Selecione um produto</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Buscar produto
          <input
            type="text"
            placeholder="Digite nome ou categoria..."
            value={searchAvailable}
            onChange={(e) => setSearchAvailable(e.target.value)}
          />
        </label>

        <div className="available-products-grid">
          {filteredAvailableProducts.map((product) => (
            <article key={product.id} className="available-product-card">
              <img src={getProductImage(product)} alt={product.name} className="available-product-image" />
              <div className="available-product-content">
                <strong>{product.name}</strong>
                <p>{product.category?.name || "Sem categoria"}</p>
              </div>
              <button className="btn sm" type="button" onClick={() => addProduct(product.id)}>
                Adicionar
              </button>
            </article>
          ))}
          {!filteredAvailableProducts.length ? (
            <p className="page-header-sub">Nenhum produto encontrado para adicionar.</p>
          ) : null}
        </div>

        <div className="actions-row">
          <button className="btn primary" onClick={saveSection} disabled={saving}>
            {saving ? "Salvando..." : "Salvar secao"}
          </button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        {success ? <p>{success}</p> : null}
      </div>

      <div className="card">
        <div className="page-header">
          <div>
            <h2 className="page-header-title">Produtos selecionados ({selectedTypeLabel})</h2>
            <p className="page-header-sub">Use as setas para ajustar a ordem de exibicao na home.</p>
          </div>
        </div>
        <div className="list-wrap">
          {selectedProducts.map((product) => {
            return (
              <article key={product.id} className="list-item">
                <img src={getProductImage(product)} alt={product.name} className="list-item-img" />
                <div className="list-item-info">
                  <strong>{product.name}</strong>
                  <p>{product.category?.name || "Sem categoria"}</p>
                </div>
                <div className="actions-row">
                  <button className="btn" onClick={() => move(product.id, -1)}>↑</button>
                  <button className="btn" onClick={() => move(product.id, 1)}>↓</button>
                  <button className="btn danger" onClick={() => removeProduct(product.id)}>Remover</button>
                </div>
              </article>
            );
          })}
          {!selectedIds.length ? <p>Nenhum produto selecionado para esta secao.</p> : null}
        </div>
      </div>
    </section>
  );
}
