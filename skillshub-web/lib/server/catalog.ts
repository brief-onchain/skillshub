import fs from 'node:fs';
import path from 'node:path';
import type {
  CatalogPayload,
  ExcludedDirection,
  OpenSourceCandidate,
  Skill,
  SkillLibrary
} from '@/lib/types';

interface LibraryFile {
  libraryId: string;
  name: string;
  version: string;
  description?: string;
  skills?: Skill[];
  excludedDirections?: ExcludedDirection[];
  openSourceCandidates?: OpenSourceCandidate[];
}

function inferProvenance(skill: Skill, libraryId: string): Skill['provenance'] {
  if (skill.provenance) {
    return skill.provenance;
  }
  if (libraryId === 'lib-3-ecosystem-intake') {
    return 'curated';
  }
  return 'original';
}

function enrichSkill(skill: Skill, libraryId: string): Skill {
  const provenance = inferProvenance(skill, libraryId);
  return {
    ...skill,
    provenance,
    maintainedBy: skill.maintainedBy || 'SkillsHub',
    sourceAttribution:
      skill.sourceAttribution ||
      (provenance === 'original' ? 'SkillsHub Original' : 'Community Open-Source Reference')
  };
}

function resolveSkillsRoot() {
  const explicit = process.env.SKILLS_ROOT_PATH;
  if (explicit && fs.existsSync(explicit)) {
    return explicit;
  }

  const local = path.join(process.cwd(), 'skills');
  if (fs.existsSync(local)) {
    return local;
  }

  return path.resolve(process.cwd(), '..', 'skills');
}

const SKILLS_ROOT = resolveSkillsRoot();

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function dedupeBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(keyFn(item), item);
  }
  return Array.from(map.values());
}

function listLibraryFiles() {
  if (!fs.existsSync(SKILLS_ROOT)) {
    return [] as string[];
  }

  return fs
    .readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('lib-'))
    .map((entry) => path.join(SKILLS_ROOT, entry.name, 'library.json'))
    .filter((p) => fs.existsSync(p));
}

function loadLibraries(): {
  libraries: SkillLibrary[];
  skills: Skill[];
  excludedDirections: ExcludedDirection[];
  openSourceCandidates: OpenSourceCandidate[];
} {
  const files = listLibraryFiles();

  const libraries: SkillLibrary[] = [];
  const skills: Skill[] = [];
  const excludedDirections: ExcludedDirection[] = [];
  const openSourceCandidates: OpenSourceCandidate[] = [];

  for (const file of files) {
    const parsed = readJson<LibraryFile>(file);

    libraries.push({
      libraryId: parsed.libraryId,
      name: parsed.name,
      version: parsed.version,
      description: parsed.description,
      localPath: path.relative(process.cwd(), path.dirname(file))
    });

    for (const skill of parsed.skills || []) {
      const skillDir = path.join(path.dirname(file), 'skills', skill.id);
      const repoRoot = path.resolve(process.cwd(), '..');
      const repoPath = fs.existsSync(skillDir)
        ? path.relative(repoRoot, skillDir).split(path.sep).join('/')
        : undefined;

      skills.push({
        ...enrichSkill(skill, parsed.libraryId),
        libraryId: parsed.libraryId,
        libraryName: parsed.name,
        repoPath
      });
    }

    excludedDirections.push(...(parsed.excludedDirections || []));
    openSourceCandidates.push(...(parsed.openSourceCandidates || []));
  }

  return {
    libraries,
    skills,
    excludedDirections: dedupeBy(excludedDirections, (x) => x.slug),
    openSourceCandidates: dedupeBy(
      openSourceCandidates,
      (x) => `${x.name}|${x.sourceTag}|${x.adaptation}`
    )
  };
}

export function loadCatalogPayload(): CatalogPayload {
  const loaded = loadLibraries();

  return {
    generatedAt: new Date().toISOString(),
    libraries: loaded.libraries,
    skills: loaded.skills,
    excludedDirections: loaded.excludedDirections,
    openSourceCandidates: loaded.openSourceCandidates
  };
}

export function loadSkillIds(): Set<string> {
  const payload = loadCatalogPayload();
  return new Set(payload.skills.map((x) => x.id));
}

export function getSkillById(skillId: string): Skill | null {
  const payload = loadCatalogPayload();
  return payload.skills.find((x) => x.id === skillId) || null;
}
