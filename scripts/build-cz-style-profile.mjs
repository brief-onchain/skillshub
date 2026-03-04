#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { Readable } from 'node:stream';

const DATASET_URL =
  process.env.CZ_DATASET_URL ||
  'https://huggingface.co/datasets/123olp/ersheng-cz-heyi-full/resolve/main/data/processed/all_hydrated.jsonl';
const OUTPUT_PATH =
  process.env.CZ_PROFILE_OUTPUT ||
  path.resolve(process.cwd(), 'skillshub-web/lib/server/data/cz_style_profile.json');
const MAX_LINES = Number(process.env.CZ_MAX_LINES || 30000);
const TOP_K = Number(process.env.CZ_TOP_K || 30);

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'that',
  'this',
  'with',
  'from',
  'you',
  'your',
  'are',
  'was',
  'were',
  'will',
  'have',
  'has',
  'not',
  'but',
  'just',
  'all',
  'our',
  'out',
  'can',
  'its',
  'about',
  'into',
  'they',
  'them',
  'what',
  'when',
  'where',
  'who',
  'how',
  'why',
  'https',
  'http',
  'com'
]);

function createStats() {
  return {
    count: 0,
    totalChars: 0,
    totalWords: 0,
    punctuation: { exclamation: 0, question: 0, ellipsis: 0 },
    topWords: new Map(),
    topCnPhrases: new Map()
  };
}

function inc(map, key) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + 1);
}

function pickTop(map, n) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term, count]) => ({ term, count }));
}

function cleanText(text) {
  return String(text || '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractWords(text) {
  const words = text
    .toLowerCase()
    .match(/[a-z][a-z0-9_'-]{2,}/g);
  if (!words) return [];
  return words.filter((w) => !STOPWORDS.has(w));
}

function extractCnPhrases(text) {
  const phrases = text.match(/[\u4e00-\u9fff]{2,}/g);
  return phrases || [];
}

async function main() {
  const cz = createStats();

  console.log(`[ersheng] downloading: ${DATASET_URL}`);
  const res = await fetch(DATASET_URL, { headers: { 'User-Agent': 'skills-lab/ersheng-profile-builder' } });
  if (!res.ok || !res.body) {
    throw new Error(`Failed to fetch dataset: ${res.status}`);
  }

  const rl = readline.createInterface({
    input: Readable.fromWeb(res.body),
    crlfDelay: Infinity
  });

  let seen = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    seen += 1;
    if (seen > MAX_LINES) break;

    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }

    const username = row.username;
    if (username !== 'cz_binance') {
      continue;
    }

    const stats = cz;
    const text = cleanText(row.text);
    if (!text) continue;

    stats.count += 1;
    stats.totalChars += text.length;
    stats.totalWords += text.split(/\s+/).filter(Boolean).length;
    stats.punctuation.exclamation += (text.match(/!/g) || []).length;
    stats.punctuation.question += (text.match(/\?/g) || []).length;
    stats.punctuation.ellipsis += (text.match(/\.\.\./g) || []).length;

    for (const word of extractWords(text)) {
      inc(stats.topWords, word);
    }
    for (const phrase of extractCnPhrases(text)) {
      inc(stats.topCnPhrases, phrase);
    }

  }

  const profile = {
    source: {
      dataset: '123olp/ersheng-cz-heyi-full',
      dataset_url: DATASET_URL,
      generated_at: new Date().toISOString(),
      max_lines: MAX_LINES
    },
    notes: [
      'Derived profile only. Raw tweet corpora are not bundled in this repository.',
      'Use profile as style guidance, not person impersonation.',
      'This profile currently targets CZ only.'
    ],
    speaker: {
      username: 'cz_binance',
      count: cz.count,
      avg_chars: cz.count ? Number((cz.totalChars / cz.count).toFixed(2)) : 0,
      avg_words: cz.count ? Number((cz.totalWords / cz.count).toFixed(2)) : 0,
      punctuation: cz.punctuation,
      top_words: pickTop(cz.topWords, TOP_K),
      top_cn_phrases: pickTop(cz.topCnPhrases, TOP_K)
    }
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(profile, null, 2), 'utf8');
  console.log(`[cz-style] wrote profile: ${OUTPUT_PATH}`);
  console.log(`[cz-style] count cz=${profile.speaker.count} (seen=${seen})`);
}

main().catch((err) => {
  console.error(`[cz-style] failed: ${err.message}`);
  process.exit(1);
});
