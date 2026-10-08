import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { db, pool, vocabularyItemsTable } from "./index.js";

type SourceEntry = {
  id: number;
  word: string;
  english_meaning: string;
  hindi_meaning: string;
  image: string;
};

type SourceFile = { entries: SourceEntry[] };
type VocabInsert = typeof vocabularyItemsTable.$inferInsert;

const dataDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../artifacts/ssc-vocab/public/data",
);

const collections = [
  {
    directory: "ows",
    file: "ows_2027.json",
    source: "ows-2027",
    category: "one_word_substitution",
    expectedCount: 2027,
  },
  {
    directory: "idioms",
    file: "idioms_1281.json",
    source: "idioms-1281",
    category: "idioms_phrases",
    expectedCount: 1281,
  },
] as const;

function readCollection(collection: (typeof collections)[number]): VocabInsert[] {
  const collectionDirectory = resolve(dataDirectory, collection.directory);
  const filePath = resolve(collectionDirectory, collection.file);
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as SourceFile;

  if (!Array.isArray(parsed.entries) || parsed.entries.length !== collection.expectedCount) {
    throw new Error(
      `${filePath} must contain ${collection.expectedCount} entries; found ${parsed.entries?.length ?? "none"}`,
    );
  }

  const seenIds = new Set<number>();
  return parsed.entries.map((entry) => {
    if (!Number.isInteger(entry.id) || entry.id < 1 || seenIds.has(entry.id)) {
      throw new Error(`Invalid or duplicate source ID ${entry.id} in ${filePath}`);
    }
    seenIds.add(entry.id);

    if (
      typeof entry.word !== "string" || !entry.word.trim() ||
      typeof entry.english_meaning !== "string" || !entry.english_meaning.trim() ||
      typeof entry.hindi_meaning !== "string" || !entry.hindi_meaning.trim() ||
      typeof entry.image !== "string" || !/^images\/\d{4}\.jpg$/.test(entry.image)
    ) {
      throw new Error(`Incomplete vocabulary entry ${entry.id} in ${filePath}`);
    }

    const imagePath = resolve(collectionDirectory, entry.image);
    if (!existsSync(imagePath)) {
      throw new Error(`Missing image for ${collection.source}:${entry.id}: ${imagePath}`);
    }

    return {
      sourceKey: `${collection.source}:${String(entry.id).padStart(4, "0")}`,
      word: entry.word.trim(),
      meaning: entry.english_meaning.trim(),
      hindiMeaning: entry.hindi_meaning.trim(),
      imageUrl: `/data/${collection.directory}/${entry.image}`,
      category: collection.category,
      alphabet: entry.word.match(/[a-z]/i)?.[0].toLowerCase() ?? "#",
      difficulty: "medium",
      isActive: true,
    };
  });
}

async function main(): Promise<void> {
  // Validate both complete datasets before making any database changes.
  const rows = collections.flatMap(readCollection);
  let inserted = 0;

  await db.transaction(async (transaction) => {
    for (let start = 0; start < rows.length; start += 100) {
      const added = await transaction
        .insert(vocabularyItemsTable)
        .values(rows.slice(start, start + 100))
        .onConflictDoNothing({ target: vocabularyItemsTable.sourceKey })
        .returning({ id: vocabularyItemsTable.id });
      inserted += added.length;
    }
  });

  console.log(
    `Vocabulary import complete: ${inserted} added, ${rows.length - inserted} already present (${rows.length} total bundled entries).`,
  );
}

try {
  await main();
} catch (error) {
  console.error("Vocabulary import failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
