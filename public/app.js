async function j(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

const state = {
  catalog: null,
  selectedSkillId: null
};

const refs = {
  healthBadge: document.getElementById('healthBadge'),
  excludedList: document.getElementById('excludedList'),
  installHint: document.getElementById('installHint'),
  skillsGrid: document.getElementById('skillsGrid'),
  ossGrid: document.getElementById('ossGrid'),
  skillSelect: document.getElementById('skillSelect'),
  skillInput: document.getElementById('skillInput'),
  runBtn: document.getElementById('runBtn'),
  useExampleBtn: document.getElementById('useExampleBtn'),
  resultBox: document.getElementById('resultBox'),
  apiBase: document.getElementById('apiBase'),
  apiPath: document.getElementById('apiPath'),
  apiKey: document.getElementById('apiKey')
};

function safeJson(obj) {
  return JSON.stringify(obj, null, 2);
}

function getSkillById(id) {
  return state.catalog.skills.find((s) => s.id === id);
}

function setSkillInputFromCurrent() {
  const skill = getSkillById(state.selectedSkillId);
  if (!skill) {
    return;
  }
  refs.skillInput.value = safeJson(skill.inputExample || {});
  refs.installHint.textContent = skill.install?.command || 'npx @bsc-skills/your-skill';
}

function renderExcluded() {
  const list = state.catalog.exclusions?.skills || [];
  refs.excludedList.innerHTML = list
    .map((x) => `<li><a href="${x.url}" target="_blank" rel="noreferrer">${x.slug}</a></li>`)
    .join('');
}

function renderSkills() {
  refs.skillsGrid.innerHTML = state.catalog.skills
    .map(
      (s) => `
      <article class="card">
        <small>${s.category}</small>
        <h3>${s.name}</h3>
        <div>${s.summary}</div>
        <div class="muted">${s.overlapPolicy}</div>
        <code>${s.install?.command || ''}</code>
        <button class="btn ghost" data-skill-id="${s.id}">Run in Playground</button>
      </article>
    `
    )
    .join('');

  refs.skillsGrid.querySelectorAll('button[data-skill-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-skill-id');
      refs.skillSelect.value = id;
      refs.skillSelect.dispatchEvent(new Event('change'));
      window.location.hash = '#playground';
    });
  });
}

function renderOss() {
  refs.ossGrid.innerHTML = state.catalog.openSourceCandidates
    .map(
      (x) => `
      <article class="card">
        <h3>${x.name}</h3>
        <div class="muted">${x.why}</div>
        <div>Adaptation: ${x.adaptPlan}</div>
        <a href="${x.repo}" target="_blank" rel="noreferrer">${x.repo}</a>
      </article>
    `
    )
    .join('');
}

function initSelect() {
  refs.skillSelect.innerHTML = state.catalog.skills
    .map((s) => `<option value="${s.id}">${s.name}</option>`)
    .join('');

  state.selectedSkillId = state.catalog.skills[0]?.id || null;
  refs.skillSelect.value = state.selectedSkillId;

  refs.skillSelect.addEventListener('change', () => {
    state.selectedSkillId = refs.skillSelect.value;
    setSkillInputFromCurrent();
  });

  setSkillInputFromCurrent();
}

async function runSkill() {
  refs.resultBox.textContent = 'Running...';

  let input;
  try {
    input = JSON.parse(refs.skillInput.value || '{}');
  } catch (err) {
    refs.resultBox.textContent = `Invalid JSON input: ${err.message}`;
    return;
  }

  try {
    const payload = {
      skillId: state.selectedSkillId,
      input,
      apiBase: refs.apiBase.value.trim(),
      apiPath: refs.apiPath.value.trim(),
      apiKey: refs.apiKey.value.trim()
    };

    const data = await j('/api/playground', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    refs.resultBox.textContent = safeJson(data);
  } catch (err) {
    refs.resultBox.textContent = `Execution failed: ${err.message}`;
  }
}

async function boot() {
  try {
    const [health, skillsResp] = await Promise.all([j('/api/health'), j('/api/skills')]);

    refs.healthBadge.textContent = health.apiConfigured
      ? `API Ready · ${health.envLoaded ? 'env loaded' : 'env missing'}`
      : `Local Mode · ${health.envLoaded ? 'env loaded' : 'env missing'}`;
    refs.healthBadge.classList.add(health.apiConfigured ? 'ok' : 'err');

    state.catalog = skillsResp.catalog;

    renderExcluded();
    renderSkills();
    renderOss();
    initSelect();

    refs.runBtn.addEventListener('click', runSkill);
    refs.useExampleBtn.addEventListener('click', setSkillInputFromCurrent);
  } catch (err) {
    refs.resultBox.textContent = `Boot failed: ${err.message}`;
    refs.healthBadge.textContent = 'Boot Failed';
    refs.healthBadge.classList.add('err');
  }
}

boot();
