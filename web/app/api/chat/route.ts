import { NextResponse } from "next/server";

// Το AI chat είναι προσωρινά απενεργοποιημένο. Η πλήρης υλοποίηση (Groq,
// tools, rate limit) βρίσκεται στο ./_disabled/route.ts — οι φάκελοι με
// πρόθεμα "_" δεν γίνονται routes στο App Router. Για επανενεργοποίηση,
// μετακινήστε το αρχείο πίσω εδώ και ορίστε GROQ_API_KEY.
export async function POST() {
  return NextResponse.json(
    { error: "Ο AI βοηθός είναι προσωρινά απενεργοποιημένος." },
    { status: 503 }
  );
}
