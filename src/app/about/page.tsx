"use client";

import { useEffect, useRef, useState } from "react";

const MUTERS = [
  {
    name: "Luca Paggi",
    bio: "Sceso dai monti lecchesi tutte le strade portano a Nolo. Dopo mille peripezie diventa definitivamente un noler e decide di partecipare alla rivista perché fa parte dello starter pack di un noler.",
  },
  {
    name: "Marco Speroni",
    bio: "Usa il magazine come terapia personale per smettere di ammorbare la gente con aneddoti su tutti i film che vede, che sono più di quelli proiettati a Cannes. Ma ora sarà anche peggio: basterà inoltrare un link.",
  },
  {
    name: "Veronica Caiani",
    bio: "Stanca di pubblicare foto di libri su Instagram decide di partecipare al progetto portando le sue idee da copywriter indie. Chissà se un giorno anche Mute magazine sarà degno di essere pubblicato tra le citazioni dei libri alternativi che tanto la appassionano.",
  },
];

// ── Collaboratori (sezione arancione) ──
// Il contenuto è editabile dalla dashboard admin e letto da /api/collaborators.
// Questi default coincidono col testo originale e fanno da fallback finché
// non viene salvata la prima versione (o se il fetch fallisce).
type Collaborator = { name: string; url: string };
const COLLAB_DEFAULT_PREFIX = "Collaborano o hanno collaborato con MUTE:";
const COLLAB_DEFAULT_ITEMS: Collaborator[] = [
  { name: "Asteriscollettivo", url: "" },
  { name: "Roman Nimets", url: "" },
  { name: "Tommaso Galloni", url: "" },
];

const G: React.CSSProperties = {
  fontFamily: "'EB Garamond', 'Garamond', Georgia, serif",
  fontWeight: 500,
};
const M: React.CSSProperties = {
  fontFamily: "var(--font-mattone), Arial, sans-serif",
};

const SECTION_PAD = "clamp(20px, 6vw, 64px)";
const YOUTUBE_ID = "_F_QIChcoI8";

function loadYTScript() {
  if (document.getElementById("yt-api-script")) return;
  const tag = document.createElement("script");
  tag.id = "yt-api-script";
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

function VideoPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  // needsTap: il browser ha bloccato l'autoplay, serve un tap dell'utente
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    loadYTScript();

    const initPlayer = () => {
      if (!containerRef.current) return;
      const div = document.createElement("div");
      div.style.width = "100%";
      div.style.height = "100%";
      containerRef.current.appendChild(div);

      playerRef.current = new (window as any).YT.Player(div, {
        videoId: YOUTUBE_ID,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: YOUTUBE_ID,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            e.target.mute();
            e.target.playVideo();
            setReady(true);
          },
          onStateChange: (e: any) => {
            const YT = (window as any).YT;
            // CUED (5) o UNSTARTED (-1) dopo onReady = autoplay bloccato dal browser
            if (e.data === YT.PlayerState.CUED || e.data === -1) {
              setNeedsTap(true);
            }
            // Appena parte, nascondi l'overlay tap
            if (e.data === YT.PlayerState.PLAYING) {
              setNeedsTap(false);
            }
          },
        },
      });
    };

    // Preserva eventuali callback già registrate (es. più componenti YT sulla stessa pagina)
    if ((window as any).YT?.Player) {
      initPlayer();
    } else {
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };
    }

    return () => {
      playerRef.current?.destroy();
    };
  }, []);

  const handleTap = () => {
    const p = playerRef.current;
    if (!p) return;
    p.mute();
    p.playVideo();
    setNeedsTap(false);
  };

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const p = playerRef.current;
    if (!p) return;
    if (muted) { p.unMute(); p.setVolume(100); setMuted(false); }
    else { p.mute(); setMuted(true); }
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      aspectRatio: "16/9",
      overflow: "hidden",
      background: "#000",
      border: "1px solid #333",
    }}>
      {/* Iframe YT: allargato per nascondere la barra logo in basso */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: "177.77%", height: "100%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* Overlay tap-to-play — appare solo se il browser ha bloccato l'autoplay */}
      {needsTap && (
        <div
          onClick={handleTap}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          {/* Triangolo play */}
          <div style={{
            width: 0, height: 0,
            borderTop: "20px solid transparent",
            borderBottom: "20px solid transparent",
            borderLeft: "34px solid rgba(255,255,255,0.85)",
            marginLeft: 6,
          }} />
        </div>
      )}

      {/* Blocca tap accidentali sull'iframe quando il video sta girando */}
      {!needsTap && (
        <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }} />
      )}

      {/* Bottone audio — visibile solo dopo che il video è partito */}
      {ready && !needsTap && (
        <button
          onClick={toggleAudio}
          aria-label={muted ? "Attiva audio" : "Disattiva audio"}
          style={{
            position: "absolute", bottom: 14, left: 14, zIndex: 10,
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.18)",
            width: 34, height: 34,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0, opacity: 0.45,
            transition: "opacity 0.2s",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.45")}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" width="15" height="15" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="15" height="15" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

// Contenuto della barra arancione: prefisso + elenco membri separati da virgola.
// I membri con un link sono cliccabili (sottolineati). Il testo scorre inline,
// quindi quando i membri diventano tanti va a capo da solo e la barra si allunga,
// restando coerente con lo stile attuale.
function CollaboratorsBar() {
  const [prefix, setPrefix] = useState(COLLAB_DEFAULT_PREFIX);
  const [items, setItems] = useState<Collaborator[]>(COLLAB_DEFAULT_ITEMS);

  useEffect(() => {
    let alive = true;
    fetch("/api/collaborators")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        if (typeof data.prefix === "string") setPrefix(data.prefix);
        if (Array.isArray(data.items)) setItems(data.items);
      })
      .catch(() => { /* fallback ai default già impostati */ });
    return () => { alive = false; };
  }, []);

  return (
    <p style={{
      ...G,
      fontSize: "clamp(14px, 2.5vw, 36px)",
      lineHeight: 1.75,
      color: "#fff",
      margin: 0,
      textAlign: "left",
    }}>
      {prefix}
      {items.length > 0 && " "}
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        // Ogni nome resta integro (no a-capo a metà parola); l'a-capo avviene
        // tra un membro e l'altro, dopo la virgola.
        const nameNode = c.url ? (
          <a
            href={c.url}
            target={/^https?:\/\//i.test(c.url) ? "_blank" : undefined}
            rel={/^https?:\/\//i.test(c.url) ? "noopener noreferrer" : undefined}
            style={{
              color: "#fff",
              textDecoration: "underline",
              textUnderlineOffset: "0.18em",
              textDecorationThickness: "1px",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {c.name}
          </a>
        ) : (
          c.name
        );

        return (
          <span key={`${c.name}-${i}`}>
            <span style={{ whiteSpace: "nowrap" }}>{nameNode}</span>
            {!isLast && ", "}
          </span>
        );
      })}
    </p>
  );
}

export default function About() {
  return (
    <main style={{ background: "#0a0a0a" }}>

      {/* ── SEZIONE NERA ── */}
      <section style={{
        background: "#0a0a0a",
        color: "#fff",
        padding: `clamp(56px, 10vw, 100px) ${SECTION_PAD} clamp(48px, 8vw, 80px)`,
        display: "flex",
        flexDirection: "column",
        gap: "clamp(28px, 5vw, 48px)",
      }}>
        <h1 style={{ ...M, fontSize: "clamp(48px, 10vw, 100px)", fontWeight: 700, lineHeight: 0.95, margin: 0 }}>
          About Us
        </h1>

        <VideoPlayer />

        <p style={{
          ...G,
          fontSize: "clamp(18px, 3vw, 36px)",
          lineHeight: 1.6,
          margin: 0,
          color: "#fff",
          fontWeight: 400,
          textAlign: "left",
        }}>
          <strong style={{ fontWeight: 700 }}>Mute Rivista</strong>{" "}
          prende vita a Milano nel 2026 da tre pseudo-intellettuali con la voglia di raccontarsi.
          Amplifica le voci soffocate dal mainstream. Vuole raccontare le curiosità che squarciano
          lo scroll infinito e ti fanno dire &ldquo;ma davvero?&rdquo;. I muti finalmente parlano: Mute dà voce
          a chi finora ha letto in silenzio, tra aneddoti culturali, riflessioni sentenziose e
          storie rimaste in sospeso.
        </p>
      </section>

      {/* ── SEZIONE BLU: I Muters ── */}
      <section style={{
        background: "#0051e8",
        color: "#fff",
        padding: `clamp(40px, 7vw, 72px) ${SECTION_PAD} clamp(40px, 7vw, 72px)`,
      }}>
        <h2 style={{ ...M, fontSize: "clamp(28px, 5.5vw, 56px)", fontWeight: 700, margin: 0, marginBottom: "clamp(28px, 5vw, 48px)" }}>
          I muters
        </h2>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {MUTERS.map((muter, i) => (
            <div
              key={muter.name}
              style={{
                marginLeft: `calc(-1 * ${SECTION_PAD})`,
                marginRight: `calc(-1 * ${SECTION_PAD})`,
                padding: `clamp(22px, 4vw, 40px) ${SECTION_PAD}`,
                borderTop: "2px solid rgba(255,255,255,0.6)",
                borderBottom: i === MUTERS.length - 1 ? "2px solid rgba(255,255,255,0.6)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: "clamp(10px, 2vw, 16px)",
              }}
            >
              <h3 style={{ ...M, fontSize: "clamp(20px, 3.5vw, 32px)", fontWeight: 700, margin: 0 }}>
                {muter.name}
              </h3>
              <p style={{
                ...G,
                fontSize: "clamp(15px, 2.5vw, 36px)",
                lineHeight: 1.6,
                margin: 0,
                color: "rgba(255,255,255,0.88)",
                textAlign: "left",
              }}>
                {muter.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOTO FULL WIDTH ── */}
      <div style={{ lineHeight: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/about_us.jpg" alt="Mute team" style={{ display: "block", width: "100%", height: "auto" }} />
      </div>

      {/* ── SEZIONE ARANCIONE ── */}
      <section style={{
        background: "#e78d1a",
        display: "flex",
        justifyContent: "flex-start",
        padding: `clamp(28px, 5vw, 48px) ${SECTION_PAD}`,
      }}>
        <CollaboratorsBar />
      </section>

    </main>
  );
}