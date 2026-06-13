"use client";

import { useEffect, useState } from "react";

type Collaborator = { name: string; url: string };

const DEFAULT_PREFIX = "Collaborano o hanno collaborato con MUTE:";

// Stile Garamond usato nella sezione arancione della pagina About — riusato
// nell'anteprima così l'admin vede esattamente come verrà renderizzato.
const GARAMOND: React.CSSProperties = {
    fontFamily: "'EB Garamond', 'Garamond', Georgia, serif",
    fontWeight: 500,
};

export default function CollaboratorsEditor() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const [prefix, setPrefix] = useState(DEFAULT_PREFIX);
    const [items, setItems] = useState<Collaborator[]>([]);

    useEffect(() => {
        fetch("/api/collaborators")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) {
                    if (typeof data.prefix === "string") setPrefix(data.prefix);
                    if (Array.isArray(data.items)) setItems(data.items);
                }
            })
            .catch(() => setStatus({ type: "error", msg: "Errore nel caricamento" }))
            .finally(() => setLoading(false));
    }, []);

    // ── Operazioni sull'array ──
    const updateItem = (i: number, field: keyof Collaborator, value: string) =>
        setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));

    const addItem = () => setItems((prev) => [...prev, { name: "", url: "" }]);

    const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

    const move = (i: number, dir: -1 | 1) =>
        setItems((prev) => {
            const j = i + dir;
            if (j < 0 || j >= prev.length) return prev;
            const next = [...prev];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
        });

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        // Scarta righe senza nome prima di salvare
        const cleaned = items
            .map((it) => ({ name: it.name.trim(), url: it.url.trim() }))
            .filter((it) => it.name.length > 0);
        try {
            const res = await fetch("/api/collaborators", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prefix: prefix.trim(), items: cleaned }),
            });
            const data = await res.json();
            if (res.ok) {
                if (Array.isArray(data.items)) setItems(data.items);
                if (typeof data.prefix === "string") setPrefix(data.prefix);
                setStatus({ type: "success", msg: "Salvato ✓" });
            } else {
                setStatus({ type: "error", msg: data.error || "Errore nel salvataggio" });
            }
        } catch {
            setStatus({ type: "error", msg: "Errore di rete" });
        } finally {
            setSaving(false);
        }
    };

    const previewItems = items.filter((it) => it.name.trim().length > 0);

    return (
        <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
            {/* Header collassabile (coerente con le altre sezioni della dashboard) */}
            <button
                onClick={() => setOpen((o) => !o)}
                style={{
                    width: "100%", textAlign: "left", padding: "14px 18px",
                    fontSize: 14, fontWeight: 600, background: open ? "#f0f0f0" : "#f8f8f8",
                    border: "none", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
            >
                <span>
                    🟠 Collaboratori
                    {!loading && (
                        <span style={{ marginLeft: 8, fontWeight: 400, color: "#888", fontSize: "0.9em" }}>
                            ({items.length})
                        </span>
                    )}
                </span>
                <span style={{ fontSize: 12 }}>{open ? "▲" : "▼"}</span>
            </button>

            {open && (
                <div style={{ padding: 18 }}>
                    {loading ? (
                        <p style={{ color: "#aaa", margin: 0 }}>Caricamento...</p>
                    ) : (
                        <>
                            {/* Anteprima dal vivo — replica esatta della barra arancione */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={labelStyle}>Anteprima</div>
                                <div style={{ background: "#e78d1a", padding: "20px 22px" }}>
                                    <p style={{ ...GARAMOND, fontSize: 18, lineHeight: 1.75, color: "#fff", margin: 0 }}>
                                        {prefix}
                                        {previewItems.length > 0 && " "}
                                        {previewItems.map((c, i) => {
                                            const isLast = i === previewItems.length - 1;
                                            return (
                                                <span key={`${c.name}-${i}`}>
                                                    <span style={{ whiteSpace: "nowrap" }}>
                                                        {c.url ? (
                                                            <span style={{
                                                                textDecoration: "underline",
                                                                textUnderlineOffset: "0.18em",
                                                                textDecorationThickness: "1px",
                                                            }}>
                                                                {c.name}
                                                            </span>
                                                        ) : (
                                                            c.name
                                                        )}
                                                    </span>
                                                    {!isLast && ", "}
                                                </span>
                                            );
                                        })}
                                    </p>
                                </div>
                                <p style={{ fontSize: 12, color: "#999", margin: "6px 0 0" }}>
                                    I membri con un link appaiono sottolineati (cliccabili). Con tanti membri
                                    il testo va a capo da solo e la barra si allunga.
                                </p>
                            </div>

                            {/* Prefisso */}
                            <div style={{ marginBottom: 18 }}>
                                <label style={labelStyle}>Testo introduttivo</label>
                                <input
                                    type="text"
                                    value={prefix}
                                    onChange={(e) => setPrefix(e.target.value)}
                                    style={inputStyle}
                                    placeholder={DEFAULT_PREFIX}
                                />
                            </div>

                            {/* Lista membri */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Membri</label>
                                {items.length === 0 && (
                                    <p style={{ fontSize: 13, color: "#999", margin: "4px 0 0" }}>
                                        Nessun membro. Aggiungine uno qui sotto.
                                    </p>
                                )}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {items.map((it, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: "flex", gap: 8, alignItems: "center",
                                                flexWrap: "wrap",
                                                background: "#fafafa", border: "1px solid #eee",
                                                borderRadius: 6, padding: "8px 10px",
                                            }}
                                        >
                                            {/* Riordino */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                <button
                                                    onClick={() => move(i, -1)}
                                                    disabled={i === 0}
                                                    title="Sposta su"
                                                    style={reorderBtnStyle(i === 0)}
                                                >▲</button>
                                                <button
                                                    onClick={() => move(i, 1)}
                                                    disabled={i === items.length - 1}
                                                    title="Sposta giù"
                                                    style={reorderBtnStyle(i === items.length - 1)}
                                                >▼</button>
                                            </div>

                                            {/* Nome */}
                                            <input
                                                type="text"
                                                value={it.name}
                                                onChange={(e) => updateItem(i, "name", e.target.value)}
                                                placeholder="Nome collaboratore"
                                                style={{ ...inputStyle, flex: "1 1 160px", minWidth: 120 }}
                                            />

                                            {/* Link (opzionale) */}
                                            <input
                                                type="text"
                                                value={it.url}
                                                onChange={(e) => updateItem(i, "url", e.target.value)}
                                                placeholder="Link (opzionale) — es. https://..."
                                                style={{ ...inputStyle, flex: "1 1 200px", minWidth: 140 }}
                                            />

                                            {/* Rimuovi */}
                                            <button
                                                onClick={() => removeItem(i)}
                                                title="Rimuovi"
                                                style={{
                                                    border: "1px solid #f0c0c0", background: "#fff",
                                                    color: "#dc2626", cursor: "pointer", borderRadius: 6,
                                                    width: 34, height: 34, fontSize: 16, lineHeight: 1,
                                                    flexShrink: 0,
                                                }}
                                            >🗑</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={addItem}
                                style={{
                                    background: "#fff", border: "1px dashed #aaa", borderRadius: 6,
                                    padding: "8px 14px", fontSize: 13, cursor: "pointer",
                                    fontFamily: "inherit", marginBottom: 18,
                                }}
                            >
                                + Aggiungi membro
                            </button>

                            {/* Salva + stato */}
                            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        background: "#111", color: "#fff", border: "none",
                                        padding: "10px 22px", fontSize: 12, letterSpacing: "0.08em",
                                        textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer",
                                        opacity: saving ? 0.6 : 1, fontFamily: "inherit", borderRadius: 6,
                                    }}
                                >
                                    {saving ? "Salvataggio..." : "Salva collaboratori"}
                                </button>
                                {status && (
                                    <span style={{
                                        fontSize: 13,
                                        color: status.type === "success" ? "#060" : "#c00",
                                    }}>
                                        {status.msg}
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
    color: "#555",
};

const inputStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: "0.55rem 0.7rem",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    background: "#fff",
    borderRadius: 6,
    boxSizing: "border-box",
};

const reorderBtnStyle = (disabled: boolean): React.CSSProperties => ({
    border: "1px solid #ddd",
    background: "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    color: disabled ? "#ccc" : "#555",
    borderRadius: 4,
    width: 22,
    height: 18,
    fontSize: 9,
    lineHeight: 1,
    padding: 0,
});
