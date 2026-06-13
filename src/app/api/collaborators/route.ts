import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const DB = "mute_magazine";
const COLL = "site_settings";
const KEY = "collaborators";

// Valori di default — coerenti con il testo originale della sezione arancione.
// Usati come fallback finché l'admin non salva la prima versione.
const DEFAULTS = {
    prefix: "Collaborano o hanno collaborato con MUTE:",
    items: [
        { name: "Asteriscollettivo", url: "" },
        { name: "Roman Nimets", url: "" },
        { name: "Tommaso Galloni", url: "" },
    ],
};

type Item = { name: string; url: string };

// Pulisce e valida la lista in arrivo dal client
function sanitizeItems(raw: unknown): Item[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((it) => {
            const name = typeof it?.name === "string" ? it.name.trim() : "";
            let url = typeof it?.url === "string" ? it.url.trim() : "";
            // Normalizza i link: se manca lo schema e non è un'ancora/relativo, anteponi https://
            if (url && !/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(url)) {
                url = "https://" + url;
            }
            return { name, url };
        })
        .filter((it) => it.name.length > 0);
}

// GET /api/collaborators — pubblica (la usa la pagina About)
export async function GET() {
    try {
        const col = (await clientPromise).db(DB).collection(COLL);
        const doc = await col.findOne({ key: KEY });

        if (!doc) {
            return NextResponse.json(DEFAULTS);
        }

        return NextResponse.json({
            prefix: typeof doc.prefix === "string" ? doc.prefix : DEFAULTS.prefix,
            items: Array.isArray(doc.items) ? doc.items : DEFAULTS.items,
        });
    } catch (err) {
        console.error("Get collaborators error:", err);
        // In caso di errore restituiamo comunque i default: la barra non resta mai vuota
        return NextResponse.json(DEFAULTS);
    }
}

// PUT /api/collaborators — protetta (middleware). Aggiorna prefisso + lista.
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const prefix =
            typeof body?.prefix === "string" ? body.prefix.trim() : DEFAULTS.prefix;
        const items = sanitizeItems(body?.items);

        const col = (await clientPromise).db(DB).collection(COLL);
        await col.updateOne(
            { key: KEY },
            { $set: { key: KEY, prefix, items, updatedAt: new Date() } },
            { upsert: true }
        );

        return NextResponse.json({ success: true, prefix, items });
    } catch (err) {
        console.error("Update collaborators error:", err);
        return NextResponse.json({ error: "Errore server" }, { status: 500 });
    }
}
