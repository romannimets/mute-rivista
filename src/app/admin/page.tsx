"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArticleCard, categoryLabels } from "@/data/articles";
import { fetchArticles } from "@/lib/fetchArticles";
import MediaStatsWidget from "@/app/components/MediaStatsWidget";
import MongoStatsWidget from "@/app/components/MongoStatsWidget";
import AnalyticsWidget from "../components/AnalyticsWidget";
import CollaboratorsEditor from "../components/CollaboratorsEditor";

type CategoryPanelState = Record<string, boolean>;

interface Subscriber {
    email: string;
    subscribedAt: string;
    consentDate: string;
}

function formatDate(d: string) {
    try {
        return new Date(d).toLocaleDateString("it-IT", {
            day: "2-digit", month: "2-digit", year: "numeric",
        });
    } catch { return d; }
}

// ── Newsletter section ─────────────────────────────────────────
function NewsletterSection() {
    const [subs, setSubs] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        fetch("/api/newsletter")
            .then((r) => r.json())
            .then(setSubs)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const exportCSV = () => {
        const rows = [
            ["email", "data_iscrizione", "data_consenso"],
            ...subs.map((s) => [s.email, s.subscribedAt, s.consentDate]),
        ];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
        const a = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(blob),
            download: `newsletter_mute_${new Date().toISOString().split("T")[0]}.csv`,
        });
        a.click();
        URL.revokeObjectURL(a.href);
        // Sblocca il pulsante "Svuota DB" solo dopo l'export
    };

    const handleClearAll = async () => {
        const confirmed = confirm(
            `⚠️ ATTENZIONE\n\n` +
            `Stai per cancellare tutti i ${subs.length} iscritti dal database.\n\n` +
            `Questa azione è irreversibile. Assicurati di aver già scaricato il CSV prima di procedere.\n\n` +
            `Continuare?`
        );
        if (!confirmed) return;
        setClearing(true);
        try {
            await fetch("/api/newsletter", { method: "DELETE" });
            setSubs([]);
        } catch { alert("Errore durante la cancellazione."); }
        finally { setClearing(false); }
    };

    return (
        <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
            {/* Header collassabile */}
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
                    📧 Newsletter — iscritti
                    {!loading && (
                        <span style={{ marginLeft: 8, fontWeight: 400, color: "#888", fontSize: "0.9em" }}>
                            ({subs.length})
                        </span>
                    )}
                </span>
                <span style={{ fontSize: 12 }}>{open ? "▲" : "▼"}</span>
            </button>

            {open && (
                <div>
                    {loading && <p style={{ padding: 20, color: "#aaa", margin: 0 }}>Caricamento...</p>}

                    {!loading && subs.length === 0 && (
                        <p style={{ padding: 20, color: "#aaa", margin: 0 }}>Nessun iscritto ancora.</p>
                    )}

                    {!loading && subs.length > 0 && (
                        <>
                            {/* Tabella iscritti */}
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid #ddd", background: "#fafafa" }}>
                                            {["Email", "Iscritto il", "Consenso il"].map((h) => (
                                                <th key={h} style={thStyle}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subs.map((s) => (
                                            <tr
                                                key={s.email}
                                                style={{ borderBottom: "1px solid #eee" }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                            >
                                                <td style={tdStyle}>{s.email}</td>
                                                <td style={{ ...tdStyle, color: "#777", whiteSpace: "nowrap" }}>{formatDate(s.subscribedAt)}</td>
                                                <td style={{ ...tdStyle, color: "#777", whiteSpace: "nowrap" }}>{formatDate(s.consentDate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Azioni — export + reset */}
                            <div style={{
                                padding: "14px 18px",
                                borderTop: "1px solid #eee",
                                background: "#fafafa",
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                flexWrap: "wrap",
                            }}>
                                <button
                                    onClick={exportCSV}
                                    style={{
                                        padding: "8px 18px", background: "#111", color: "#fff",
                                        border: "none", fontWeight: 700, fontSize: 13,
                                        letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
                                    }}
                                >
                                    ↓ Esporta CSV
                                </button>

                                <button
                                    onClick={handleClearAll}
                                    disabled={clearing}
                                    style={{
                                        padding: "8px 18px", background: "#dc2626", color: "#fff",
                                        border: "none", fontWeight: 700, fontSize: 13,
                                        letterSpacing: "0.06em", textTransform: "uppercase",
                                        cursor: clearing ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {clearing ? "Cancellando..." : "🗑 Svuota DB"}
                                </button>

                                <span style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>
                                    ⚠️ Esporta sempre il CSV prima di svuotare — l'operazione è irreversibile.
                                </span>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Dashboard principale ───────────────────────────────────────
export default function AdminDashboard() {
    const [manifesto, setManifesto] = useState<ArticleCard | null>(null);
    const [editingManifesto, setEditingManifesto] = useState(false);
    const [manifestoDraft, setManifestoDraft] = useState("");
    const [savingManifesto, setSavingManifesto] = useState(false);
    const [articles, setArticles] = useState<ArticleCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedPanels, setExpandedPanels] = useState<CategoryPanelState>({});
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [showDevStats, setShowDevStats] = useState(false);

    useEffect(() => {
        const init: CategoryPanelState = {};
        Object.keys(categoryLabels).forEach((c) => (init[c] = false));
        setExpandedPanels(init);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const cats = Object.keys(categoryLabels);
                const all: ArticleCard[] = [];
                for (const c of cats) {
                    const data = await fetchArticles(c);
                    all.push(...data.map((a) => ({ ...a, category: c })));
                }
                setArticles(all);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        })();
    }, []);

    useEffect(() => {
        fetch("/api/articles/manifesto")
            .then((r) => r.ok ? r.json() : null)
            .then((data) => { if (data) { setManifesto(data); setManifestoDraft(data.content || ""); } })
            .catch(console.error);
    }, []);

    const togglePanel = (cat: string) =>
        setExpandedPanels((prev) => ({ ...prev, [cat]: !prev[cat] }));

    const saveManifesto = async () => {
        if (!manifesto) return;
        setSavingManifesto(true);
        try {
            await fetch("/api/articles/manifesto", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: manifestoDraft }),
            });
            setManifesto({ ...manifesto, content: manifestoDraft });
            setEditingManifesto(false);
        } catch { alert("Errore salvataggio"); }
        finally { setSavingManifesto(false); }
    };

    const handleToggleHidden = async (article: ArticleCard) => {
        setTogglingId(article.id);
        try {
            const res = await fetch(`/api/articles/${article.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hidden: !article.hidden }),
            });
            if (!res.ok) throw new Error();
            setArticles((prev) =>
                prev.map((a) => a.id === article.id ? { ...a, hidden: !a.hidden } : a)
            );
        } catch { alert("Errore aggiornamento visibilità"); }
        finally { setTogglingId(null); }
    };

    const handleDelete = async (article: ArticleCard) => {
        if (!confirm(`Eliminare "${article.title}"? Verranno cancellati anche tutti i media.`)) return;
        setDeletingId(article.id);
        try {
            const res = await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            const result = await res.json();
            setArticles((prev) => prev.filter((a) => a.id !== article.id));
            alert(`Eliminato. Media cancellati: ${result.mediaDeleted || 0}`);
        } catch { alert("Errore eliminazione"); }
        finally { setDeletingId(null); }
    };

    if (loading) {
        return (
            <div style={{ padding: "clamp(48px, 12vw, 96px)", textAlign: "center" }}>
                <div className="spinner" style={spinnerStyle} />
                <p style={{ marginTop: 16, color: "#666" }}>Caricamento dashboard...</p>
            </div>
        );
    }

    return (
        <main style={{ padding: "clamp(24px, 6vw, 48px)", maxWidth: 1200, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                <h1 style={{ fontSize: "clamp(24px, 6vw, 32px)", margin: 0 }}>Gestione articoli</h1>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Link href="/admin/impostazioni" style={{ background: "#fff", color: "#111", padding: "10px 16px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        ⚙️ Impostazioni
                    </Link>
                    <button
                        onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); window.location.href = "/admin/login"; }}
                        style={{ background: "#fff", color: "#111", padding: "10px 16px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                    >
                        Logout
                    </button>
                    <Link href="/admin/nuovo" style={{ background: "#111", color: "#fff", padding: "10px 20px", borderRadius: 6, fontWeight: 600, fontSize: 14 }}>
                        + Nuovo Articolo
                    </Link>
                </div>
            </div>

            {/* ── Newsletter (in cima) ── */}
            <NewsletterSection />

            {/* Manifesto */}
            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 20, background: "#fafafa", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h2 style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>📜 Manifesto</h2>
                    <button
                        onClick={editingManifesto ? saveManifesto : () => setEditingManifesto(true)}
                        disabled={savingManifesto}
                        style={iconButtonStyle}
                        title={editingManifesto ? "Salva" : "Modifica"}
                    >
                        {editingManifesto ? (savingManifesto ? "⏳" : "💾") : "✏️"}
                    </button>
                </div>
                <textarea
                    value={editingManifesto ? manifestoDraft : manifesto?.content || ""}
                    onChange={(e) => setManifestoDraft(e.target.value)}
                    readOnly={!editingManifesto}
                    rows={6}
                    style={{
                        width: "100%", resize: "vertical", padding: 12, borderRadius: 6,
                        border: "1px solid #ccc", fontSize: 14,
                        background: editingManifesto ? "#fff" : "#f5f5f5",
                        fontFamily: "inherit",
                    }}
                />
            </div>

            {/* ── Collaboratori (sezione arancione About) ── */}
            <CollaboratorsEditor />

            {/* Dev Stats */}
            <div style={{ marginBottom: 24, border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden", background: "#f9f9f9" }}>
                <button
                    onClick={() => setShowDevStats(!showDevStats)}
                    style={{
                        width: "100%", textAlign: "left", padding: "12px 18px", fontSize: 14,
                        fontWeight: 600, background: "#f9f9f9", border: "none", cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center", color: "#666",
                    }}
                >
                    <span>🛠️ Developer Stats</span>
                    <span style={{ fontSize: 12 }}>{showDevStats ? "▲" : "▼"}</span>
                </button>
                {showDevStats && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, padding: 16, background: "#fff" }}>
                        <MediaStatsWidget />
                        <MongoStatsWidget />
                        <AnalyticsWidget />
                    </div>
                )}
            </div>

            {/* Accordion categorie */}
            <div>
                <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>📚 Articoli per categoria</h2>
                {Object.keys(categoryLabels).map((cat) => {
                    const catArticles = articles.filter((a) => a.category === cat);
                    const isOpen = expandedPanels[cat];
                    return (
                        <div key={cat} style={{ marginBottom: 16, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
                            <button
                                onClick={() => togglePanel(cat)}
                                style={{
                                    width: "100%", textAlign: "left", padding: "14px 18px",
                                    fontSize: "clamp(14px, 3vw, 16px)", fontWeight: 600,
                                    background: isOpen ? "#f0f0f0" : "#f8f8f8", border: "none", cursor: "pointer",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                }}
                            >
                                <span>
                                    {categoryLabels[cat]}
                                    <span style={{ marginLeft: 8, fontWeight: 500, color: "#666", fontSize: "0.9em" }}>
                                        ({catArticles.length})
                                    </span>
                                </span>
                                <span style={{ fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                            </button>

                            {isOpen && (
                                <div style={{ overflowX: "auto" }}>
                                    {catArticles.length === 0 ? (
                                        <p style={{ padding: 20, textAlign: "center", color: "#999", margin: 0 }}>
                                            Nessun articolo in questa categoria
                                        </p>
                                    ) : (
                                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                                            <thead>
                                                <tr style={{ borderBottom: "2px solid #ddd", background: "#fafafa" }}>
                                                    <th style={thStyle}>Titolo</th>
                                                    <th style={thStyle}>Autore</th>
                                                    <th style={thStyle}>Data</th>
                                                    <th style={thStyle}>Visibilità</th>
                                                    <th style={thStyle}>Azioni</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {catArticles.map((a) => {
                                                    const isDeleting = deletingId === a.id;
                                                    const isToggling = togglingId === a.id;
                                                    return (
                                                        <tr
                                                            key={a.id}
                                                            style={{ borderBottom: "1px solid #eee", opacity: isDeleting ? 0.5 : 1, transition: "opacity 0.3s", background: a.hidden ? "#fffbf0" : "transparent" }}
                                                            onMouseEnter={(e) => { if (!isDeleting) e.currentTarget.style.background = a.hidden ? "#fff8e0" : "#f9f9f9"; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.background = a.hidden ? "#fffbf0" : "transparent"; }}
                                                        >
                                                            <td style={tdStyle}>
                                                                <strong style={{ color: a.hidden ? "#aaa" : "#111" }}>{a.title}</strong>
                                                                {a.hidden && <span style={{ marginLeft: 6, fontSize: 11, color: "#e07000", fontWeight: 700, letterSpacing: "0.05em" }}>NASCOSTO</span>}
                                                            </td>
                                                            <td style={{ ...tdStyle, color: a.hidden ? "#bbb" : "inherit" }}>{a.author}</td>
                                                            <td style={{ ...tdStyle, color: a.hidden ? "#bbb" : "inherit" }}>{new Date(a.date).toLocaleDateString("it-IT")}</td>
                                                            <td style={tdStyle}>
                                                                <button
                                                                    onClick={() => handleToggleHidden(a)}
                                                                    disabled={isToggling}
                                                                    title={a.hidden ? "Rendi visibile" : "Nascondi"}
                                                                    style={{
                                                                        border: "none", background: "none", cursor: isToggling ? "not-allowed" : "pointer",
                                                                        fontSize: 18, lineHeight: 1, padding: 2, opacity: isToggling ? 0.5 : 1,
                                                                    }}
                                                                >
                                                                    {a.hidden ? "🙈" : "👁️"}
                                                                </button>
                                                            </td>
                                                            <td style={tdStyle}>
                                                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                                    <Link href={`/admin/${a.id}`} style={{ color: "#0066cc", fontWeight: 500, fontSize: "clamp(12px, 3vw, 14px)" }}>
                                                                        ✏️ Modifica
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => handleDelete(a)}
                                                                        disabled={isDeleting}
                                                                        style={{ color: isDeleting ? "#999" : "#dc2626", cursor: isDeleting ? "not-allowed" : "pointer", border: "none", background: "none", padding: 0, fontWeight: 500, fontSize: "clamp(12px, 3vw, 14px)", display: "flex", alignItems: "center", gap: 4 }}
                                                                    >
                                                                        {isDeleting && <div className="spinner" style={tinySpinnerStyle} />}
                                                                        {isDeleting ? "Eliminando..." : "🗑️ Elimina"}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </main>
    );
}

const spinnerStyle: React.CSSProperties = { width: 40, height: 40, border: "4px solid #f3f3f3", borderTop: "4px solid #111", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" };
const tinySpinnerStyle: React.CSSProperties = { width: 12, height: 12, border: "2px solid #dc2626", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "12px 16px", fontSize: "clamp(13px, 3vw, 14px)", fontWeight: 600, color: "#555" };
const tdStyle: React.CSSProperties = { padding: "12px 16px", fontSize: "clamp(13px, 3vw, 14px)", wordBreak: "break-word" };
const iconButtonStyle: React.CSSProperties = { border: "none", background: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 };