import { getPortalHtml, getRecentPredpisy, getRozsireneByIri, getVersionIriForDate } from "./slovlex.js";
import { extractParagrafFromPortalHtml, renderParagraf, renderWholeLawText } from "./portal.js";

async function run() {
  const baseIri = "/SK/ZZ/2003/595";
  const { versionIri } = await getVersionIriForDate(baseIri, "2025-01-01");
  const meta = await getRozsireneByIri(versionIri);
  const html = await getPortalHtml(versionIri);
  const extracted = extractParagrafFromPortalHtml(html, "15");
  if (!extracted) throw new Error("Missing paragraf-15");
  const text = renderParagraf(extracted.$, extracted.$par);
  const wholeLaw = renderWholeLawText(html, 4_000).text;
  if (!wholeLaw.includes("Tento zákon upravuje")) {
    throw new Error("Whole-law render is missing expected paragraph body text.");
  }
  const recent = await getRecentPredpisy();
  if (!recent.length) {
    throw new Error("Recent RSS feed is empty.");
  }
  console.log(`OK ${versionIri} účinnosť ${meta.ucinnyOd} - ${meta.ucinnyDo}`);
  console.log(text.split("\n").slice(0, 12).join("\n"));
  console.log(`Whole-law render check OK, RSS items: ${recent.length}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
