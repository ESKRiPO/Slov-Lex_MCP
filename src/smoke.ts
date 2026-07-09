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

  const { versionIri: criminalCodeIri } = await getVersionIriForDate(
    "/SK/ZZ/2005/300",
    "2025-01-01",
  );
  const criminalCodeHtml = await getPortalHtml(criminalCodeIri);
  const paragraph16 = extractParagrafFromPortalHtml(criminalCodeHtml, "16");
  if (!paragraph16) throw new Error("Missing paragraf-16 in criminal code.");
  const paragraph16Text = renderParagraf(paragraph16.$, paragraph16.$par);
  if (!paragraph16Text.includes("Trestný čin je spáchaný z nedbanlivosti")) {
    throw new Error("Direct paragraph text is missing from paragraf-16.");
  }

  const { versionIri: constitutionIri } = await getVersionIriForDate(
    "/SK/ZZ/1992/460",
    "2025-01-01",
  );
  const constitutionHtml = await getPortalHtml(constitutionIri);
  const constitutionText = renderWholeLawText(constitutionHtml, 5_000).text;
  if (!constitutionText.includes("Čl. 1") || !constitutionText.includes("Slovenská republika")) {
    throw new Error("Constitutional articles are missing from whole-law render.");
  }

  const recent = await getRecentPredpisy();
  if (!recent.length) {
    throw new Error("Recent RSS feed is empty.");
  }
  console.log(`OK ${versionIri} účinnosť ${meta.ucinnyOd} - ${meta.ucinnyDo}`);
  console.log(text.split("\n").slice(0, 12).join("\n"));
  console.log(
    `Whole-law, direct-text paragraph and constitutional article checks OK; RSS items: ${recent.length}`,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
