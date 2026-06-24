/**
 * audit.mjs — Compare fallback content against live Sanity documents
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/audit.mjs
 *
 * Prints a field-by-field diff for each document type. Fields that exist only
 * in Sanity (e.g. photos) are skipped — the audit focuses on text content that
 * originates in the fallback JSON files.
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const SANITY_DATASET = process.env.SANITY_DATASET ?? "production";

for (const [key, val] of Object.entries({
  SANITY_PROJECT_ID,
  SANITY_API_TOKEN,
})) {
  if (!val) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2025-01-01",
  token: SANITY_API_TOKEN,
  useCdn: false,
});

function fallback(filename) {
  return JSON.parse(
    readFileSync(join(__dirname, "../src/fallback-content", filename), "utf-8"),
  );
}

// ── Diff helpers ────────────────────────────────────────────────────────────

let totalDiffs = 0;
let currentSectionTitle = "";
let sectionLines = [];

function startSection(title) {
  currentSectionTitle = title;
  sectionLines = [];
}

function endSection() {
  if (sectionLines.length === 0) {
    console.log(`  ✓  ${currentSectionTitle}`);
  } else {
    console.log(`\n  ✗  ${currentSectionTitle}`);
    sectionLines.forEach((l) => console.log(l));
  }
  console.log("");
}

// Recursively sort object keys so key-order differences don't show as diffs.
function sortKeys(val) {
  if (Array.isArray(val)) return val.map(sortKeys);
  if (val !== null && typeof val === "object") {
    return Object.fromEntries(
      Object.keys(val)
        .sort()
        .map((k) => [k, sortKeys(val[k])]),
    );
  }
  return val;
}

function diff(label, local, remote, { blankEqualsNull = false } = {}) {
  let a = local ?? null;
  let b = remote ?? null;
  if (blankEqualsNull) {
    if (a === "") a = null;
    if (b === "") b = null;
  }
  const localStr = JSON.stringify(sortKeys(a));
  const remoteStr = JSON.stringify(sortKeys(b));
  if (localStr === remoteStr) return;
  totalDiffs++;
  sectionLines.push(`      ✗ ${label}`);
  sectionLines.push(`          fallback: ${JSON.stringify(a)}`);
  sectionLines.push(`          sanity:   ${JSON.stringify(b)}`);
}

// ── siteSettings ────────────────────────────────────────────────────────────

async function auditSiteSettings() {
  startSection("siteSettings  ←  restaurant.json");
  const local = fallback("restaurant.json");
  const remote = await client.fetch(
    `*[_type == "siteSettings"][0]{ name, tagline, url, address, phone, hours, privateDiningEmail, reservations{ label, shortLabel, href }, social{ instagram, facebook } }`,
  );

  if (!remote) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff("name", local.name, remote.name);
  diff("tagline", local.tagline, remote.tagline);
  diff("url", local.url, remote.url);
  diff("address", local.address, remote.address);
  diff("phone", local.phone, remote.phone);
  diff("hours", local.hours, remote.hours);
  diff(
    "privateDiningEmail",
    local.privateDiningEmail,
    remote.privateDiningEmail,
  );
  diff(
    "reservations.label",
    local.reservations?.label,
    remote.reservations?.label,
  );
  diff(
    "reservations.shortLabel",
    local.reservations?.shortLabel,
    remote.reservations?.shortLabel,
  );
  diff(
    "reservations.href",
    local.reservations?.href,
    remote.reservations?.href,
  );
  diff("social.instagram", local.social?.instagram, remote.social?.instagram);
  diff("social.facebook", local.social?.facebook, remote.social?.facebook);
  endSection();
}

// ── diningArea ──────────────────────────────────────────────────────────────

async function auditDiningOptions() {
  startSection("diningArea  ←  dining-options.json");
  const localAreas = fallback("dining-options.json");
  const remoteAreas = await client.fetch(
    `*[_type == "diningArea"] | order(order asc){ "id": id.current, order, number, label, title, dark, description, details[]{ label, value, linkType }, ctaLabel, phoneReserve, finePrint }`,
  );

  for (const local of localAreas) {
    const remote = remoteAreas.find((r) => r.id === local.id);
    const prefix = local.id;

    if (!remote) {
      sectionLines.push(`      ✗ ${prefix}: document not found in Sanity`);
      totalDiffs++;
      continue;
    }

    diff(`${prefix}.order`, local.order, remote.order);
    diff(`${prefix}.number`, local.number, remote.number);
    diff(`${prefix}.label`, local.label, remote.label);
    diff(`${prefix}.title`, local.title, remote.title);
    diff(`${prefix}.dark`, local.dark, remote.dark);
    diff(`${prefix}.description`, local.description, remote.description);
    diff(`${prefix}.ctaLabel`, local.ctaLabel, remote.ctaLabel);
    diff(`${prefix}.phoneReserve`, local.phoneReserve, remote.phoneReserve);
    diff(
      `${prefix}.finePrint`,
      local.finePrint ?? null,
      remote.finePrint ?? null,
    );

    // Compare details arrays by label
    const localDetails = local.details ?? [];
    const remoteDetails = remote.details ?? [];
    const allLabels = new Set([
      ...localDetails.map((d) => d.label),
      ...remoteDetails.map((d) => d.label),
    ]);
    for (const lbl of allLabels) {
      const ld = localDetails.find((d) => d.label === lbl);
      const rd = remoteDetails.find((d) => d.label === lbl);
      diff(
        `${prefix}.details[${lbl}].value`,
        ld?.value ?? null,
        rd?.value ?? null,
        { blankEqualsNull: true },
      );
      diff(
        `${prefix}.details[${lbl}].linkType`,
        ld?.linkType ?? "none",
        rd?.linkType ?? "none",
      );
    }
  }

  // Check for remote documents not present in fallback
  for (const remote of remoteAreas) {
    if (!localAreas.find((l) => l.id === remote.id)) {
      sectionLines.push(
        `      ℹ  ${remote.id}: exists in Sanity but not in fallback`,
      );
    }
  }
  endSection();
}

// ── menu ────────────────────────────────────────────────────────────────────

async function auditMenu() {
  startSection("menu  ←  menu-sections.json");
  const local = fallback("menu-sections.json");
  const remote = await client.fetch(
    `*[_type == "menu"][0]{ season, footer_note, sections[]{ title, items[]{ name, price, description } } }`,
  );

  if (!remote) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff("season", local.season, remote.season);
  diff("footer_note", local.footer_note, remote.footer_note);

  const localSections = local.sections ?? [];
  const remoteSections = remote.sections ?? [];

  if (localSections.length !== remoteSections.length) {
    diff("sections.length", localSections.length, remoteSections.length);
  }

  for (
    let si = 0;
    si < Math.max(localSections.length, remoteSections.length);
    si++
  ) {
    const ls = localSections[si];
    const rs = remoteSections[si];
    const sp = `sections[${si}]`;

    if (!ls) {
      sectionLines.push(`      ✗ ${sp}: missing in fallback`);
      totalDiffs++;
      continue;
    }
    if (!rs) {
      sectionLines.push(`      ✗ ${sp}: missing in Sanity`);
      totalDiffs++;
      continue;
    }

    diff(`${sp}.title`, ls.title, rs.title);

    const localItems = ls.items ?? [];
    const remoteItems = rs.items ?? [];

    if (localItems.length !== remoteItems.length) {
      diff(`${sp}.items.length`, localItems.length, remoteItems.length);
    }

    for (
      let ii = 0;
      ii < Math.max(localItems.length, remoteItems.length);
      ii++
    ) {
      const li = localItems[ii];
      const ri = remoteItems[ii];
      const ip = `${sp}.items[${ii}]`;

      if (!li) {
        sectionLines.push(`      ✗ ${ip}: missing in fallback`);
        totalDiffs++;
        totalDiffs++;
        continue;
      }
      if (!ri) {
        sectionLines.push(`      ✗ ${ip}: missing in Sanity`);
        totalDiffs++;
        totalDiffs++;
        continue;
      }

      diff(`${ip}.name`, li.name, ri.name);
      diff(`${ip}.price`, li.price, ri.price);
      diff(`${ip}.description`, li.description, ri.description);
    }
  }
  endSection();
}

// ── reservationExperiences ──────────────────────────────────────────────────

async function auditReservations() {
  startSection("reservationExperience  ←  reservations.json");
  const localExps = fallback("reservations.json");
  const remoteExps = await client.fetch(
    `*[_type == "reservationExperience"] | order(order asc){ "id": id.current, order, number, eyebrow, title, description, note, details[]{ label, value, linkType } }`,
  );

  for (const local of localExps) {
    const remote = remoteExps.find((r) => r.id === local.id);
    const prefix = local.id;

    if (!remote) {
      sectionLines.push(`      ✗ ${prefix}: document not found in Sanity`);
      totalDiffs++;
      continue;
    }

    diff(`${prefix}.order`, local.order, remote.order);
    diff(`${prefix}.number`, local.number, remote.number);
    diff(`${prefix}.eyebrow`, local.eyebrow, remote.eyebrow);
    diff(`${prefix}.title`, local.title, remote.title);
    diff(`${prefix}.description`, local.description, remote.description);
    diff(`${prefix}.note`, local.note ?? null, remote.note ?? null);

    const localDetails = local.details ?? [];
    const remoteDetails = remote.details ?? [];
    const allLabels = new Set([
      ...localDetails.map((d) => d.label),
      ...remoteDetails.map((d) => d.label),
    ]);
    for (const lbl of allLabels) {
      const ld = localDetails.find((d) => d.label === lbl);
      const rd = remoteDetails.find((d) => d.label === lbl);
      diff(
        `${prefix}.details[${lbl}].value`,
        ld?.value ?? null,
        rd?.value ?? null,
        { blankEqualsNull: true },
      );
      diff(
        `${prefix}.details[${lbl}].linkType`,
        ld?.linkType ?? "none",
        rd?.linkType ?? "none",
      );
    }
  }
  endSection();
}

// ── menusPage ───────────────────────────────────────────────────────────────

async function auditMenusPage() {
  startSection("menusPage  ←  menus-page.json");
  const local = fallback("menus-page.json");
  const remote = await client.fetch(
    `*[_type == "menusPage"][0]{ accuracyNote, walkInsNote }`,
  );

  if (!remote) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff("accuracyNote", local.accuracyNote, remote.accuracyNote);
  diff("walkInsNote", local.walkInsNote, remote.walkInsNote);
  endSection();
}

// ── reservationsPage ────────────────────────────────────────────────────────

async function auditReservationsPage() {
  startSection("reservationsPage  ←  reservations-page.json");
  const local = fallback("reservations-page.json");
  const remote = await client.fetch(
    `*[_type == "reservationsPage"][0]{ pageTitle, pageLead, seoDescription, bookingUrl }`,
  );

  if (!remote) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff("pageTitle", local.pageTitle, remote.pageTitle);
  diff("pageLead", local.pageLead, remote.pageLead);
  diff("seoDescription", local.seoDescription, remote.seoDescription);
  diff("bookingUrl", local.bookingUrl ?? null, remote.bookingUrl ?? null);
  endSection();
}

// ── homepageContent ─────────────────────────────────────────────────────────

async function auditHomepage() {
  startSection("homepageContent  ←  homepage.json");
  const local = fallback("homepage.json");
  const remote = await client.fetch(
    `*[_type == "homepageContent"][0]{ statement{ eyebrow, tags, definitionTerm, definitionText, description }, teasersEyebrow, intro{ eyebrow, paragraphs } }`,
  );

  if (!remote) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff(
    "statement.eyebrow",
    local.statement?.eyebrow,
    remote.statement?.eyebrow,
  );
  diff("statement.tags", local.statement?.tags, remote.statement?.tags);
  diff(
    "statement.definitionTerm",
    local.statement?.definitionTerm,
    remote.statement?.definitionTerm,
  );
  diff(
    "statement.definitionText",
    local.statement?.definitionText,
    remote.statement?.definitionText,
  );
  diff(
    "statement.description",
    local.statement?.description,
    remote.statement?.description,
  );
  diff("teasersEyebrow", local.teasersEyebrow, remote.teasersEyebrow);
  diff("intro.eyebrow", local.intro?.eyebrow, remote.intro?.eyebrow);
  diff("intro.paragraphs", local.intro?.paragraphs, remote.intro?.paragraphs);
  endSection();
}

// ── teamMember ──────────────────────────────────────────────────────────────

async function auditTeamMembers() {
  startSection("teamMember  ←  team.json");
  const localMembers = fallback("team.json");
  const remoteMembers = await client.fetch(
    `*[_type == "teamMember"] | order(order asc){ name, roles, bio, order }`,
  );

  for (const local of localMembers) {
    const remote = remoteMembers.find((r) => r.name === local.name);
    if (!remote) {
      sectionLines.push(`      ✗ ${local.name}: not found in Sanity`);
      totalDiffs++;
      continue;
    }
    diff(`${local.name}.roles`, local.roles, remote.roles);
    diff(`${local.name}.bio`, local.bio, remote.bio);
    diff(`${local.name}.order`, local.order, remote.order);
  }

  for (const remote of remoteMembers) {
    if (!localMembers.find((l) => l.name === remote.name)) {
      sectionLines.push(
        `      ℹ  ${remote.name}: exists in Sanity but not in fallback`,
      );
    }
  }
  endSection();
}

// ── teamPage ────────────────────────────────────────────────────────────────

async function auditTeamPage() {
  startSection("teamPage  ←  team-page.json");
  const local = fallback("team-page.json");
  const remote = await client.fetch(
    `*[_type == "teamPage"][0]{ pageTitle, pageLead, seoDescription, chefLinkText }`,
  );

  if (!remote) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff("pageTitle", local.pageTitle, remote.pageTitle);
  diff("pageLead", local.pageLead, remote.pageLead);
  diff("seoDescription", local.seoDescription, remote.seoDescription);
  diff("chefLinkText", local.chefLinkText, remote.chefLinkText);
  endSection();
}

// ── chefProfile ─────────────────────────────────────────────────────────────

async function auditChefProfile() {
  startSection("chefProfile  ←  chef.json");
  const local = fallback("chef.json");
  const remote = await client.fetch(
    `*[_type == "chefProfile"][0]{ name, title, roles, bio, accolades[]{ year, text } }`,
  );

  if (!remote) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff("name", local.name, remote.name);
  diff("title", local.title, remote.title);
  diff("roles", local.roles, remote.roles);
  diff("bio", local.bio, remote.bio);
  diff("accolades", local.accolades, remote.accolades);
  endSection();
}

// ── farm ────────────────────────────────────────────────────────────────────

async function auditFarms() {
  startSection("farm  ←  farms.json");
  const localFarms = fallback("farms.json");
  const remoteFarms = await client.fetch(
    `*[_type == "farm"] | order(order asc){ name, location, order }`,
  );

  for (const local of localFarms) {
    const remote = remoteFarms.find((r) => r.name === local.name);
    if (!remote) {
      sectionLines.push(`      ✗ ${local.name}: not found in Sanity`);
      totalDiffs++;
      continue;
    }
    diff(`${local.name}.location`, local.location, remote.location);
    diff(`${local.name}.order`, local.order, remote.order);
  }

  for (const remote of remoteFarms) {
    if (!localFarms.find((l) => l.name === remote.name)) {
      sectionLines.push(
        `      ℹ  ${remote.name}: exists in Sanity but not in fallback`,
      );
    }
  }
  endSection();
}

// ── galleryPhoto ─────────────────────────────────────────────────────────────

async function auditGallery() {
  startSection("galleryPhoto  ←  gallery.json");
  const localPhotos = fallback("gallery.json");
  const remotePhotos = await client.fetch(
    `*[_type == "galleryPhoto"] | order(order asc){ order, alt, span }`,
  );

  if (localPhotos.length !== remotePhotos.length) {
    diff("count", localPhotos.length, remotePhotos.length);
  }

  for (const local of localPhotos) {
    const remote = remotePhotos.find((r) => r.order === local.order);
    if (!remote) {
      sectionLines.push(`      ✗ order ${local.order}: not found in Sanity`);
      totalDiffs++;
      continue;
    }
    diff(`[${local.order}].alt`, local.alt, remote.alt);
    diff(`[${local.order}].span`, local.span, remote.span);
  }
  endSection();
}

// ── largePartyPage + large_party_package ─────────────────────────────────────

async function auditLargeParty() {
  startSection("largePartyPage  ←  private-events-page.json");
  const localPage = fallback("private-events-page.json");
  const remotePage = await client.fetch(
    `*[_type == "largePartyPage"][0]{ capacityStats[]{ value, label } }`,
  );

  if (!remotePage) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
  } else {
    diff("capacityStats", localPage.capacityStats, remotePage.capacityStats);
  }
  endSection();

  startSection("large_party_package  ←  private-event-packages.json");
  const localPkgs = fallback("private-event-packages.json");
  const remotePkgs = await client.fetch(
    `*[_type == "large_party_package"] | order(order asc){ order, eyebrow, title, description, details[]{ label, value }, note, dark }`,
  );

  for (const local of localPkgs) {
    const remote = remotePkgs.find((r) => r.title === local.title);
    if (!remote) {
      sectionLines.push(`      ✗ "${local.title}": not found in Sanity`);
      totalDiffs++;
      continue;
    }
    diff(`${local.title}.eyebrow`, local.eyebrow, remote.eyebrow);
    diff(`${local.title}.description`, local.description, remote.description);
    diff(`${local.title}.note`, local.note ?? null, remote.note ?? null);
    diff(`${local.title}.dark`, local.dark, remote.dark);

    const localDetails = local.details ?? [];
    const remoteDetails = remote.details ?? [];
    const allLabels = new Set([
      ...localDetails.map((d) => d.label),
      ...remoteDetails.map((d) => d.label),
    ]);
    for (const lbl of allLabels) {
      const ld = localDetails.find((d) => d.label === lbl);
      const rd = remoteDetails.find((d) => d.label === lbl);
      diff(
        `${local.title}.details[${lbl}]`,
        ld?.value ?? null,
        rd?.value ?? null,
      );
    }
  }
  endSection();
}

// ── navLinks ────────────────────────────────────────────────────────────────

async function auditNavLinks() {
  startSection("navLinks  ←  nav-links.json");
  const localLinks = fallback("nav-links.json");
  const remote = await client.fetch(
    `*[_type == "navLinks"][0]{ links[]{ label, href, hidden, children[]{ label, href } } }`,
  );

  if (!remote) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  // Normalize before comparing:
  // - unify _hidden (fallback) and hidden (Sanity) into a single hidden key
  // - drop children: null (GROQ returns null for missing arrays; fallback omits the key)
  const normalize = (links) =>
    links.map(({ _hidden, hidden, children, ...rest }) => ({
      ...rest,
      ...(_hidden || hidden ? { hidden: true } : {}),
      ...(children != null ? { children } : {}),
    }));

  diff("links", normalize(localLinks), normalize(remote.links ?? []));
  endSection();
}

// ── footerLinks ─────────────────────────────────────────────────────────────

async function auditFooterLinks() {
  startSection("footerLinks  ←  footer-links.json");
  const local = fallback("footer-links.json");
  const remote = await client.fetch(
    `*[_type == "footerLinks"][0]{ secondaryLinks[]{ label, href }, legalLinks[]{ label, href } }`,
  );

  if (!remote) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff("secondaryLinks", local.secondaryLinks, remote.secondaryLinks);
  diff("legalLinks", local.legalLinks, remote.legalLinks);
  endSection();
}

// ── aboutPage ───────────────────────────────────────────────────────────────

async function auditAboutPage() {
  startSection("aboutPage  ←  about-page.json");
  const local = fallback("about-page.json");
  const remote = await client.fetch(
    `*[_type == "aboutPage"][0]{ statement, farmsIntro }`,
  );

  if (!remote) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff("statement", local.statement, remote.statement);
  diff("farmsIntro", local.farmsIntro ?? null, remote.farmsIntro ?? null);
  endSection();
}

// ── mailingListPage ──────────────────────────────────────────────────────────

async function auditMailingListPage() {
  startSection("mailingListPage  ←  mailing-list-page.json");
  const local = fallback("mailing-list-page.json");
  const remote = await client.fetch(
    `*[_type == "mailingListPage"][0]{ eyebrow, pageTitle, pageLead, seoDescription, submitLabel, successEyebrow, successMessage }`,
  );

  if (!remote) {
    sectionLines.push("      ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff("eyebrow", local.eyebrow, remote.eyebrow);
  diff("pageTitle", local.pageTitle, remote.pageTitle);
  diff("pageLead", local.pageLead, remote.pageLead);
  diff("seoDescription", local.seoDescription, remote.seoDescription);
  diff("submitLabel", local.submitLabel, remote.submitLabel);
  diff("successEyebrow", local.successEyebrow, remote.successEyebrow);
  diff("successMessage", local.successMessage, remote.successMessage);
  endSection();
}

// ── Run all ─────────────────────────────────────────────────────────────────

console.log("\nUrban Hearth — Sanity vs Fallback Content Audit");
console.log(`Dataset: ${SANITY_DATASET}`);

await auditSiteSettings();
await auditHomepage();
await auditDiningOptions();
await auditMenu();
await auditReservations();
await auditMenusPage();
await auditReservationsPage();
await auditTeamMembers();
await auditTeamPage();
await auditChefProfile();
await auditFarms();
await auditGallery();
await auditLargeParty();
await auditNavLinks();
await auditFooterLinks();
await auditAboutPage();
await auditMailingListPage();

console.log(`\n${"─".repeat(60)}`);
if (totalDiffs === 0) {
  console.log("  ✓ All checked fields match.\n");
} else {
  console.log(
    `  ${totalDiffs} difference${totalDiffs === 1 ? "" : "s"} found.\n`,
  );
}
