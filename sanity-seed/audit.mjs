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

function diff(label, local, remote) {
  const localStr = JSON.stringify(local ?? null);
  const remoteStr = JSON.stringify(remote ?? null);
  if (localStr === remoteStr) return;
  totalDiffs++;
  console.log(`  ✗ ${label}`);
  console.log(`      fallback: ${localStr}`);
  console.log(`      sanity:   ${remoteStr}`);
}

function section(title) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

// ── siteSettings ────────────────────────────────────────────────────────────

async function auditSiteSettings() {
  section("siteSettings  ←  restaurant.json");
  const local = fallback("restaurant.json");
  const remote = await client.fetch(
    `*[_type == "siteSettings"][0]{ name, tagline, url, address, phone, hours, privateDiningEmail, reservations{ label, shortLabel, href }, social{ instagram, facebook } }`,
  );

  if (!remote) {
    console.log("  ✗ Document not found in Sanity");
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
}

// ── diningArea ──────────────────────────────────────────────────────────────

async function auditDiningOptions() {
  section("diningArea  ←  dining-options.json");
  const localAreas = fallback("dining-options.json");
  const remoteAreas = await client.fetch(
    `*[_type == "diningArea"] | order(order asc){ "id": id.current, order, number, label, title, dark, description, details[]{ label, value, linkType }, ctaLabel, phoneReserve, finePrint }`,
  );

  for (const local of localAreas) {
    const remote = remoteAreas.find((r) => r.id === local.id);
    const prefix = local.id;

    if (!remote) {
      console.log(`  ✗ ${prefix}: document not found in Sanity`);
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
      console.log(`  ℹ  ${remote.id}: exists in Sanity but not in fallback`);
    }
  }
}

// ── menu ────────────────────────────────────────────────────────────────────

async function auditMenu() {
  section("menu  ←  menu-sections.json");
  const local = fallback("menu-sections.json");
  const remote = await client.fetch(
    `*[_type == "menu"][0]{ season, footer_note, sections[]{ title, items[]{ name, price, description } } }`,
  );

  if (!remote) {
    console.log("  ✗ Document not found in Sanity");
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
      console.log(`  ✗ ${sp}: missing in fallback`);
      totalDiffs++;
      continue;
    }
    if (!rs) {
      console.log(`  ✗ ${sp}: missing in Sanity`);
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
        console.log(`  ✗ ${ip}: missing in fallback`);
        totalDiffs++;
        continue;
      }
      if (!ri) {
        console.log(`  ✗ ${ip}: missing in Sanity`);
        totalDiffs++;
        continue;
      }

      diff(`${ip}.name`, li.name, ri.name);
      diff(`${ip}.price`, li.price, ri.price);
      diff(`${ip}.description`, li.description, ri.description);
    }
  }
}

// ── reservationExperiences ──────────────────────────────────────────────────

async function auditReservations() {
  section("reservationExperience  ←  reservations.json");
  const localExps = fallback("reservations.json");
  const remoteExps = await client.fetch(
    `*[_type == "reservationExperience"] | order(order asc){ "id": id.current, order, number, eyebrow, title, description, note, details[]{ label, value, linkType } }`,
  );

  for (const local of localExps) {
    const remote = remoteExps.find((r) => r.id === local.id);
    const prefix = local.id;

    if (!remote) {
      console.log(`  ✗ ${prefix}: document not found in Sanity`);
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
      );
      diff(
        `${prefix}.details[${lbl}].linkType`,
        ld?.linkType ?? "none",
        rd?.linkType ?? "none",
      );
    }
  }
}

// ── menusPage ───────────────────────────────────────────────────────────────

async function auditMenusPage() {
  section("menusPage  ←  menus-page.json");
  const local = fallback("menus-page.json");
  const remote = await client.fetch(
    `*[_type == "menusPage"][0]{ accuracyNote, walkInsNote }`,
  );

  if (!remote) {
    console.log("  ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff("accuracyNote", local.accuracyNote, remote.accuracyNote);
  diff("walkInsNote", local.walkInsNote, remote.walkInsNote);
}

// ── reservationsPage ────────────────────────────────────────────────────────

async function auditReservationsPage() {
  section("reservationsPage  ←  reservations-page.json");
  const local = fallback("reservations-page.json");
  const remote = await client.fetch(
    `*[_type == "reservationsPage"][0]{ pageTitle, pageLead, seoDescription, bookingUrl }`,
  );

  if (!remote) {
    console.log("  ✗ Document not found in Sanity");
    totalDiffs++;
    return;
  }

  diff("pageTitle", local.pageTitle, remote.pageTitle);
  diff("pageLead", local.pageLead, remote.pageLead);
  diff("seoDescription", local.seoDescription, remote.seoDescription);
  diff("bookingUrl", local.bookingUrl ?? null, remote.bookingUrl ?? null);
}

// ── Run all ─────────────────────────────────────────────────────────────────

console.log("\nUrban Hearth — Sanity vs Fallback Content Audit");
console.log(`Dataset: ${SANITY_DATASET}`);

await auditSiteSettings();
await auditDiningOptions();
await auditMenu();
await auditReservations();
await auditMenusPage();
await auditReservationsPage();

console.log(`\n${"─".repeat(60)}`);
if (totalDiffs === 0) {
  console.log("  ✓ All checked fields match.\n");
} else {
  console.log(
    `  ${totalDiffs} difference${totalDiffs === 1 ? "" : "s"} found.\n`,
  );
}
