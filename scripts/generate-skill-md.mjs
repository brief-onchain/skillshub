import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'skills');

function toSkillName(id) {
  return id.replace(/-/g, '_');
}

const libDirs = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith('lib-'))
  .map((d) => path.join(root, d.name));

for (const libDir of libDirs) {
  const jsonPath = path.join(libDir, 'library.json');
  if (!fs.existsSync(jsonPath)) continue;

  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const skills = parsed.skills || [];

  for (const skill of skills) {
    const skillDir = path.join(libDir, 'skills', skill.id);
    fs.mkdirSync(skillDir, { recursive: true });

    const content = `---
name: ${toSkillName(skill.id)}
description: ${skill.description}
---

# ${skill.name}

## Usage

- Category: ${skill.category}
- Mode: ${skill.mode || 'live'}
- Version: ${skill.version}

## Input Example

\
\
\
${JSON.stringify(skill.inputExample || {}, null, 2)}
\
\
\

## Local Install (planned)

\
\
\
npx @skillsbrain/${skill.id}
\
\
\
`;

    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content, 'utf8');
  }
}

console.log('Generated SKILL.md files for all libraries.');
