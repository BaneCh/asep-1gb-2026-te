import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { readFileSync } from "fs";
import { join } from "path";
import { rateLimit } from "@/lib/rate-limit";

// === GROQ KEYS (comma-separated στο env) ===
const GROQ_KEYS = (process.env.GROQ_API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

console.log(`[INIT] ${GROQ_KEYS.length} Groq keys loaded`);

// === Key cooldowns (rate limit tracking) ===
const keyCooldowns: Record<string, number> = {};

function isKeyOnCooldown(keyId: string): boolean {
  return keyCooldowns[keyId] !== undefined && Date.now() < keyCooldowns[keyId];
}

function setKeyCooldown(keyId: string, ms = 60000) {
  keyCooldowns[keyId] = Date.now() + ms;
}

// === CONTEXT ===
let contextData: any = null;

function getContext() {
  if (!contextData) {
    const globalStats = JSON.parse(
      readFileSync(
        join(process.cwd(), "public", "data", "global_stats.json"),
        "utf-8"
      )
    );
    const eidStats = JSON.parse(
      readFileSync(
        join(process.cwd(), "public", "data", "eidikotites_stats.json"),
        "utf-8"
      )
    );
    const eidIndex = JSON.parse(
      readFileSync(
        join(process.cwd(), "public", "data", "eidikotites_index.json"),
        "utf-8"
      )
    );

    let faqData: any = { faq: [], helpdesk: {}, theseis_PE: 0 };
    try {
      faqData = JSON.parse(
        readFileSync(join(process.cwd(), "data", "faq.json"), "utf-8")
      );
    } catch {
      // skip
    }

    const topEid = eidIndex
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 30)
      .map(
        (e: any) =>
          `- ${e.eidikotita} (slug: ${e.slug}, υποψήφιοι: ${e.count}, διοριστέοι: ${
            eidStats[e.slug]?.dioristoi || 0
          })`
      )
      .join("\n");

    const faqContext = (faqData.faq || [])
      .map((item: any) => `Q: ${item.q}\nA: ${item.a}`)
      .join("\n\n");

    contextData = { globalStats, topEid, faqData, faqContext };
  }
  return contextData;
}

function escapeUserInput(text: string): string {
  return text
    .replace(/<\/user_input>/gi, "")
    .replace(/<user_input>/gi, "")
    .replace(/<\/?system>/gi, "")
    .replace(/<\|/g, "")
    .replace(/\|>/g, "")
    .trim();
}

// === TOOLS ===
function normalizeName(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// === DIRECT DATA ACCESS (No localhost fetches) ===
function getSearchIndex(): any[] {
  try {
    return JSON.parse(
      readFileSync(
        join(process.cwd(), "public", "data", "search_index.json"),
        "utf-8"
      )
    );
  } catch {
    return [];
  }
}

async function searchCandidate(
  eponymo: string,
  onoma?: string
): Promise<any[]> {
  try {
    const cleanEponymo = eponymo.trim();
    if (!cleanEponymo) return [];

    const index = getSearchIndex();
    const epNorm = normalizeName(cleanEponymo);
    const onNorm = onoma && onoma.trim() ? normalizeName(onoma) : null;

    let results = index.filter((r: any) => {
      const rEp = normalizeName(r.eponymo || "");
      return rEp.includes(epNorm) || epNorm.includes(rEp);
    });

    if (onNorm) {
      results = results.filter((r: any) => {
        const rOn = normalizeName(r.onoma || "");
        return rOn.includes(onNorm) || onNorm.includes(rOn);
      });
    }

    return results.slice(0, 10);
  } catch (e) {
    console.error("searchCandidate error:", e);
    return [];
  }
}

async function getCandidateProfile(am: string): Promise<any | null> {
  try {
    const targetAm = String(am).replace(/\.0$/, "").trim();
    const chunkIndex = JSON.parse(
      readFileSync(
        join(process.cwd(), "public", "data", "chunk_index.json"),
        "utf-8"
      )
    );
    const chunksDir = join(process.cwd(), "public", "data", "chunks");

    for (const [slug, chunks] of Object.entries(chunkIndex)) {
      for (const chunkName of chunks as string[]) {
        const chunk = JSON.parse(
          readFileSync(join(chunksDir, chunkName), "utf-8")
        );
        const found = chunk.find(
          (r: any) => String(r.am).replace(/\.0$/, "").trim() === targetAm
        );
        if (found) {
          return { ...found, slug };
        }
      }
    }
    return null;
  } catch (e) {
    console.error("getCandidateProfile error:", e);
    return null;
  }
}

// Επιστρέφουμε ΠΛΗΡΕΣ το προφίλ για να μπορεί το LLM να απαντήσει σε οποιοδήποτε ερώτημα
// (Ειδικές κατηγορίες και πατρώνυμο δεν δημοσιεύονται σε αυτό το project.)
function formatProfile(profile: any) {
  const isDioristaios = !!profile.thesi_diorismou;

  return {
    am: String(profile.am).replace(/\.0$/, ""),
    eponymo: profile.eponymo,
    onoma: profile.onoma,
    eidikotita: profile.eidikotita,
    omada_prosonton: profile.omada_prosonton,
    vathmologia: profile.vathmologia,
    seira_katataxis: profile.aa,
    katastasi: isDioristaios
      ? "ΔΙΟΡΙΣΤΕΟΣ"
      : "ΜΗ ΔΙΟΡΙΣΤΕΟΣ (στους πίνακες κατάταξης)",
    thesi_diorismou: profile.thesi_diorismou || null,
    diorismos_meso_aytou_tou_pinaka: !!profile.dioristike,
    entopiotita: profile.kod_entopiotitas
      ? `Κωδικός ${profile.kod_entopiotitas} (Μόρια: ${profile.monades_entop || 0})`
      : "Χωρίς εντοπιότητα",
    metaptyxiako: profile.metaptyxiako ? "ΝΑΙ" : "ΟΧΙ",
    didaktoriko: profile.didaktoriko ? "ΝΑΙ" : "ΟΧΙ",
    xeni_glossa: profile.xeni_glossa ? "ΝΑΙ" : "ΟΧΙ",
    empeiria_mines: profile.minas_empeirias || 0,
    empeiria_monades: profile.monades_empeirias || 0,
    mathima_1_gnoseis: profile.math1,
    mathima_2_dexiotites: profile.math2,
    synolo_graptou: profile.synolo_graptou,
    protimiseis_theseon: profile.protimiseis || null,
  };
}

async function getEidikotitaStats(slug: string): Promise<any | null> {
  try {
    const eidStats = JSON.parse(
      readFileSync(
        join(process.cwd(), "public", "data", "eidikotites_stats.json"),
        "utf-8"
      )
    );
    if (eidStats[slug]) {
      return { slug, stats: eidStats[slug] };
    }
    return null;
  } catch (e) {
    console.error("getEidikotitaStats error:", e);
    return null;
  }
}

async function getPositionInfo(thesiKod: string): Promise<any> {
  try {
    const chunkIndex = JSON.parse(
      readFileSync(
        join(process.cwd(), "public", "data", "chunk_index.json"),
        "utf-8"
      )
    );
    const chunksDir = join(process.cwd(), "public", "data", "chunks");

    const targetKod = String(thesiKod).replace(/\.0$/, "");
    const found: any[] = [];

    for (const [slug, chunks] of Object.entries(chunkIndex)) {
      for (const chunkName of chunks as string[]) {
        const chunk = JSON.parse(
          readFileSync(join(chunksDir, chunkName), "utf-8")
        );
        for (const r of chunk) {
          const kod = String(r.thesi_diorismou || "").replace(/\.0$/, "");
          if (r.dioristike && kod === targetKod) {
            found.push({
              am: String(r.am).replace(/\.0$/, ""),
              eponymo: r.eponymo,
              onoma: r.onoma,
              eidikotita: r.eidikotita,
              vathmologia: r.vathmologia,
              slug,
            });
          }
        }
      }
    }

    return { kod: thesiKod, count: found.length, candidates: found.slice(0, 30) };
  } catch (e: any) {
    return { error: e.message };
  }
}

// === SYSTEM PROMPT (Ελεύθερο Reasoning & Ευφυΐα) ===
const SYSTEM_PROMPT = `Είσαι ο έξυπνος βοηθός για τα οριστικά αποτελέσματα της προκήρυξης ΑΣΕΠ 1ΓΒ/2026 (θέσεις Τεχνολογικής Εκπαίδευσης – ΤΕ, 2.628 θέσεις, από συμμετέχοντες στον γραπτό διαγωνισμό 1Γ/2025).

ΡΟΛΟΣ & ΣΚΟΠΟΣ:
- Βοηθάς τους υποψηφίους να κατανοήσουν τη θέση τους στους πίνακες, αν διορίστηκαν και πού, τα μόριά τους, καθώς και κριτήρια όπως εντοπιότητα, τίτλους σπουδών και προτιμήσεις θέσεων.
- Σκέψου συνδυαστικά και ανθρώπινα. Αν ένας χρήστης ρωτάει κάτι για την αίτησή του ή το προφίλ του (π.χ. «πόσα μόρια έχω», «μέτρησε η εντοπιότητά μου;»), εξήγησε ότι αυτά τα στοιχεία υπάρχουν στους πίνακες και ΖΗΤΑ του ευγενικά το Ονοματεπώνυμο ή τον Αριθμό Μητρώου (Α.Μ.) της αίτησής του για να ελέγξεις το προφίλ του.
- Χρησιμοποίησε τα διαθέσιμα εργαλεία (search_candidate, get_candidate_profile, get_position_info, get_eidikotita_stats) για να ανακτήσεις τα πραγματικά δεδομένα πριν απαντήσεις.
- Όταν βρίσκεις το προφίλ, απάντησε ξεκάθαρα και με ακρίβεια σε αυτό που ρώτησε.

ΥΦΟΣ:
- Φιλικό, προσγειωμένο, κατανοητό, χωρίς γραφειοκρατική ξύλινη γλώσσα.
- Απάντα πάντα στα Ελληνικά.

ΣΗΜΑΝΤΙΚΕΣ ΔΙΕΥΚΡΙΝΙΣΕΙΣ:
- Ένας υποψήφιος εμφανίζεται σε πολλούς πίνακες κατάταξης και ομάδες προσόντων. Η θέση διορισμού αναγράφεται σε όλες τις εγγραφές του· ο διορισμός έγινε μέσω της εγγραφής με diorismos_meso_aytou_tou_pinaka = true.
- Πληροφορίες για ειδικές κατηγορίες (ΑΜΕΑ, πολυτεκνία κ.λπ.) ΔΕΝ υπάρχουν στα δεδομένα· μην κάνεις υποθέσεις γι' αυτές.
- Οι απορριπτέοι υποψήφιοι δεν περιλαμβάνονται στα δεδομένα.

ΓΕΝΙΚΑ ΣΤΟΙΧΕΙΑ ΔΙΑΓΩΝΙΣΜΟΥ:
Σύνολο Υποψηφίων: ${getContext().globalStats.total_candidates} | Διοριστέοι: ${getContext().globalStats.total_dioristoi}
Μέση Βαθμολογία: ${getContext().globalStats.avg_vath} | Max: ${getContext().globalStats.max_vath}
Σύνολο θέσεων προκήρυξης: ${getContext().globalStats.total_theseis}
Τα αποτελέσματα είναι οριστικά.`;


// === TOOLS SCHEMA ===
const tools = [
  {
    type: "function" as const,
    function: {
      name: "search_candidate",
      description: "Αναζητά υποψήφιο με επώνυμο και προαιρετικά όνομα.",
      parameters: {
        type: "object",
        properties: {
          eponymo: { type: "string", description: "Το επώνυμο (π.χ. 'Παπαδόπουλος')" },
          onoma: { type: "string", description: "Το όνομα (προαιρετικό)" },
        },
        required: ["eponymo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_candidate_profile",
      description: "Ανακτά την πλήρη καρτέλα υποψηφίου με βάση τον Α.Μ. της αίτησης.",
      parameters: {
        type: "object",
        properties: {
          am: { type: "string", description: "Ο Α.Μ. αίτησης του υποψηφίου" },
        },
        required: ["am"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_eidikotita_stats",
      description: "Στατιστικά και βάσεις για μια ειδικότητα.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string", description: "Το slug της ειδικότητας" },
        },
        required: ["slug"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_position_info",
      description: "Ποιοι διορίστηκαν σε συγκεκριμένο κωδικό θέσης.",
      parameters: {
        type: "object",
        properties: {
          thesi_kod: { type: "string", description: "Ο κωδικός θέσης" },
        },
        required: ["thesi_kod"],
      },
    },
  },
];

// === TOOL DISPATCHER ===
async function executeTool(name: string, args: any): Promise<string> {
  try {
    if (name === "search_candidate") {
      const results = await searchCandidate(args.eponymo, args.onoma);
      if (results.length === 0) {
        return `Δεν βρέθηκαν αποτελέσματα για "${args.eponymo}".`;
      }
      return JSON.stringify(
        {
          total: results.length,
          candidates: results.map((r) => ({
            am: String(r.am).replace(/\.0$/, ""),
            eponymo: r.eponymo,
            onoma: r.onoma,
            slug: r.slug,
          })),
        },
        null,
        2
      );
    }

    if (name === "get_candidate_profile") {
      const profile = await getCandidateProfile(args.am);
      if (!profile) return `Δεν βρέθηκε υποψήφιος με Α.Μ. ${args.am}.`;
      return JSON.stringify(formatProfile(profile), null, 2);
    }

    if (name === "get_eidikotita_stats") {
      const stats = await getEidikotitaStats(args.slug);
      if (!stats) return `Δεν βρέθηκε ειδικότητα.`;
      return JSON.stringify({ slug: stats.slug, stats: stats.stats }, null, 2);
    }

    if (name === "get_position_info") {
      const result = await getPositionInfo(args.thesi_kod);
      return JSON.stringify(result, null, 2);
    }

    return `Άγνωστο εργαλείο: ${name}`;
  } catch (e: any) {
    return `Σφάλμα: ${e.message}`;
  }
}

// === GROQ CALL WITH ROTATION ===
async function callGroqWithRotation(conversation: any[]): Promise<any> {
  for (let i = 0; i < GROQ_KEYS.length; i++) {
    const keyId = `groq-${i}`;
    if (isKeyOnCooldown(keyId)) continue;

    try {
      const groq = new Groq({ apiKey: GROQ_KEYS[i] });
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: conversation,
        tools: tools,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 600,
      });
      return completion;
    } catch (e: any) {
      const errStr = String(e).toLowerCase();
      if (errStr.includes("429") || errStr.includes("rate")) {
        setKeyCooldown(keyId, 60000);
        continue;
      }
      console.error(`[GROQ] Key ${i + 1} error:`, e.message);
      continue;
    }
  }
  throw new Error("All Groq keys exhausted");
}

// === MAIN HANDLER ===
export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // 2 ερωτήσεις ανά 30 λεπτά
    const limit = rateLimit(ip, 2, 30 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Έφτασες το όριο (2 ερωτήσεις / 30 λεπτά). Τα tokens δεν είναι άπειρα 😉 Δοκίμασε ξανά αργότερα." },
        { status: 429 }
      );
    }

    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const lastUser = messages.filter((m: any) => m.role === "user").pop();
    if (!lastUser || !lastUser.content) {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    if (lastUser.content.length > 350) {
      return NextResponse.json(
        { error: "Η ερώτηση είναι πολύ μεγάλη (max 350 χαρακτήρες)." },
        { status: 400 }
      );
    }

    // Μόνο πραγματικά prompt leak hacks μπλοκάρονται, καμία φυσιολογική ερώτηση
    if (/system\s+prompt\s+leak/i.test(lastUser.content)) {
      return NextResponse.json({
        reply: "Δεν μπορώ να απαντήσω σε αυτό. Ρώτησέ με οτιδήποτε για τα αποτελέσματα του διαγωνισμού!",
        remaining: limit.remaining,
      });
    }

    const wrappedPrevious = messages.slice(-4, -1).map((m: any) => ({
      role: m.role,
      content:
        m.role === "user"
          ? `<user_input>${escapeUserInput(m.content)}</user_input>`
          : m.content,
    }));

    const conversation: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...wrappedPrevious,
      {
        role: "user",
        content: `<user_input>${escapeUserInput(lastUser.content)}</user_input>`,
      },
    ];

    let iterations = 0;
    const MAX_ITERATIONS = 3;
    let finalReply = "";

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      let completion;
      try {
        completion = await callGroqWithRotation(conversation);
      } catch {
        return NextResponse.json({
          reply: "Ο AI βοηθός είναι προσωρινά απασχολημένος. Δοκίμασε σε 1-2 λεπτά.",
          remaining: limit.remaining,
        });
      }

      const message = completion.choices[0]?.message;
      if (!message) {
        finalReply = "Σφάλμα απάντησης.";
        break;
      }

      if (message.tool_calls && message.tool_calls.length > 0) {
        conversation.push(message);
        for (const toolCall of message.tool_calls) {
          const result = await executeTool(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments)
          );
          conversation.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
        continue;
      }

      finalReply = message.content || "Δεν μπόρεσα να βρω απάντηση.";
      break;
    }

    return NextResponse.json({
      reply: finalReply,
      remaining: limit.remaining,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Σφάλμα συστήματος. Δοκίμασε ξανά." },
      { status: 500 }
    );
  }
}