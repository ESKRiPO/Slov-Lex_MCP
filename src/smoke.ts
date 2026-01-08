import { getPortalHtml, getRozsireneByIri, getVersionIriForDate } from "./slovlex.js";
import { extractParagrafFromPortalHtml, renderParagraf } from "./portal.js";

async function run() {
  const baseIri = "/SK/ZZ/2003/595";
  const { versionIri } = await getVersionIriForDate(baseIri, "2025-01-01");
  const meta = await getRozsireneByIri(versionIri);
  const html = await getPortalHtml(versionIri);
  const extracted = extractParagrafFromPortalHtml(html, "15");
  if (!extracted) throw new Error("Missing paragraf-15");
  const text = renderParagraf(extracted.$, extracted.$par);
  console.log(`OK ${versionIri} účinnosť ${meta.ucinnyOd} - ${meta.ucinnyDo}`);
  console.log(text.split("\n").slice(0, 12).join("\n"));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

