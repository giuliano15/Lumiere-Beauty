import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

const SECTION_OPTIONS = [
  { value: "HERO", label: "Hero" },
  { value: "LIVE", label: "Live" },
  { value: "LANCAMENTOS", label: "Lancamentos" },
  { value: "DESTAQUES", label: "Destaques" },
];

export function HomeSectionsPage() {
  const [products, setProducts] = useState([]);
  const [type, setType] = useState("HERO");
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

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
        <h2>Home Sections</h2>
        <label>
          Secao
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {SECTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label>
          Adicionar produto na secao
          <select onChange={(e) => { addProduct(e.target.value); e.target.value = ""; }} defaultValue="">
            <option value="">Selecione um produto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <div className="actions-row">
          <button className="btn primary" onClick={saveSection} disabled={saving}>
            {saving ? "Salvando..." : "Salvar secao"}
          </button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        {success ? <p>{success}</p> : null}
      </div>

      <div className="card">
        <h2>Ordem dos itens ({SECTION_OPTIONS.find((opt) => opt.value === type)?.label})</h2>
        <div className="list-wrap">
          {selectedIds.map((id) => {
            const product = productMap.get(id);
            if (!product) return null;
            return (
              <article key={id} className="list-item">
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.category?.name || "Sem categoria"}</p>
                </div>
                <div className="actions-row">
                  <button className="btn" onClick={() => move(id, -1)}>↑</button>
                  <button className="btn" onClick={() => move(id, 1)}>↓</button>
                  <button className="btn danger" onClick={() => removeProduct(id)}>Remover</button>
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
