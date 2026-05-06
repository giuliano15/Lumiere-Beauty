import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const initialSettings = {
  storeName: "",
  whatsappNumber: "",
  pixDiscount: 15,
  shippingText: "",
  installmentsText: "",
  supportText: "",
  instagramUrl: "",
  tiktokUrl: "",
};

export function SettingsPage() {
  const [form, setForm] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const data = await apiFetch("/admin/settings");
        if (data) setForm({ ...initialSettings, ...data });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          pixDiscount: Number(form.pixDiscount || 0),
        }),
      });
      setSuccess("Configuracoes salvas com sucesso.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h2>Configuracoes da loja</h2>
      {loading ? <p>Carregando...</p> : null}
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>Nome da loja<input value={form.storeName} onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))} /></label>
        <label>WhatsApp<input value={form.whatsappNumber} onChange={(e) => setForm((p) => ({ ...p, whatsappNumber: e.target.value }))} required /></label>
        <label>Desconto Pix (%)<input type="number" value={form.pixDiscount} onChange={(e) => setForm((p) => ({ ...p, pixDiscount: e.target.value }))} /></label>
        <label>Texto de frete<input value={form.shippingText || ""} onChange={(e) => setForm((p) => ({ ...p, shippingText: e.target.value }))} /></label>
        <label>Texto de parcelamento<input value={form.installmentsText || ""} onChange={(e) => setForm((p) => ({ ...p, installmentsText: e.target.value }))} /></label>
        <label>Texto de suporte<input value={form.supportText || ""} onChange={(e) => setForm((p) => ({ ...p, supportText: e.target.value }))} /></label>
        <label>Instagram URL<input value={form.instagramUrl || ""} onChange={(e) => setForm((p) => ({ ...p, instagramUrl: e.target.value }))} /></label>
        <label>TikTok URL<input value={form.tiktokUrl || ""} onChange={(e) => setForm((p) => ({ ...p, tiktokUrl: e.target.value }))} /></label>

        <div className="actions-row">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar configuracoes"}
          </button>
        </div>
      </form>
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p>{success}</p> : null}
    </section>
  );
}
