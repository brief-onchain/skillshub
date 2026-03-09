const i18n = {
  en: {
    eyebrow: 'BSC ON-CHAIN INTELLIGENCE PLATFORM',
    heroTitle: 'On-Chain Intelligence, Modular by Design',
    heroLead: 'Production-ready BSC skill modules with built-in playground. Connect your API, pick a skill, and start building.',
    launchPlayground: 'Launch Playground',
    viewOss: 'View Open Source Intake',
    diffTracks: 'Differentiated Skill Tracks',
    diffDesc: 'Focused on data analytics and risk intelligence — areas underserved in the current BSC ecosystem.',
    installLocally: 'Usage by Source',
    installDesc: 'No unified npm install yet. Use Playground for local skills, and follow upstream commands for external integrations.',
    starterPack: 'Starter Skills Pack',
    starterTag: 'read-only / low-risk / fast ship',
    playgroundTitle: 'Playground',
    playgroundTag: 'API-ready',
    skillLabel: 'Skill',
    apiBaseLabel: 'API Base (Optional — falls back to local)',
    apiPathLabel: 'API Path',
    apiKeyLabel: 'API Key (Optional)',
    inputJson: 'Input JSON',
    runSkill: 'Run Skill',
    loadExample: 'Load Example',
    result: 'Result',
    ossTitle: 'Open Source Intake',
    ossTag: 'github curated',
    runInPlayground: 'Run in Playground',
    source: 'Source',
    xProfile: 'X',
    adaptation: 'Adaptation',
    langSwitch: '中文',
  },
  zh: {
    eyebrow: 'BSC 链上智能平台',
    heroTitle: '链上智能，模块化设计',
    heroLead: '生产就绪的 BSC 技能模块，内置试验场。连接 API，选择技能，开始构建。',
    launchPlayground: '启动试验场',
    viewOss: '查看开源项目引入',
    diffTracks: '差异化技能路线',
    diffDesc: '聚焦数据分析和风险情报 — 当前 BSC 生态中服务不足的领域。',
    installLocally: '按来源使用',
    installDesc: '当前没有统一 npm 安装入口。本地技能优先在 Playground 使用，外部集成按上游命令执行。',
    starterPack: '入门技能包',
    starterTag: '只读 / 低风险 / 快速上线',
    playgroundTitle: '试验场',
    playgroundTag: 'API 就绪',
    skillLabel: '技能',
    apiBaseLabel: 'API 地址（可选 — 默认本地）',
    apiPathLabel: 'API 路径',
    apiKeyLabel: 'API 密钥（可选）',
    inputJson: '输入 JSON',
    runSkill: '运行技能',
    loadExample: '加载示例',
    result: '结果',
    ossTitle: '开源项目引入',
    ossTag: 'GitHub 精选',
    runInPlayground: '在试验场中运行',
    source: '来源',
    xProfile: 'X',
    adaptation: '适配方案',
    langSwitch: 'EN',
  }
};

let currentLang = localStorage.getItem('skillsbrain-locale') || (navigator.language.startsWith('zh') ? 'zh' : 'en');

function T() { return i18n[currentLang]; }

function applyStaticI18n() {
  const t = T();
  document.querySelector('.hero .eyebrow').textContent = t.eyebrow;
  document.querySelector('.hero h1').textContent = t.heroTitle;
  document.querySelector('.hero .lead').textContent = t.heroLead;
  const heroActions = document.querySelectorAll('.hero .hero-actions a');
  if (heroActions[0]) heroActions[0].textContent = t.launchPlayground;
  if (heroActions[1]) heroActions[1].textContent = t.viewOss;

  const articles = document.querySelectorAll('.grid-two article');
  if (articles[0]) {
    articles[0].querySelector('h2').textContent = t.diffTracks;
    articles[0].querySelector('.muted').textContent = t.diffDesc;
  }
  if (articles[1]) {
    articles[1].querySelector('h2').textContent = t.installLocally;
    articles[1].querySelector('.muted').textContent = t.installDesc;
  }

  const skillsSection = document.getElementById('skills');
  if (skillsSection) {
    skillsSection.querySelector('.section-head h2').textContent = t.starterPack;
    skillsSection.querySelector('.section-head .tag').textContent = t.starterTag;
  }

  const pgSection = document.getElementById('playground');
  if (pgSection) {
    pgSection.querySelector('.section-head h2').textContent = t.playgroundTitle;
    pgSection.querySelector('.section-head .tag').textContent = t.playgroundTag;
    const labels = pgSection.querySelectorAll('label');
    labels.forEach((lbl) => {
      if (lbl.htmlFor === 'skillSelect') lbl.textContent = t.skillLabel;
      if (lbl.htmlFor === 'apiBase') lbl.textContent = t.apiBaseLabel;
      if (lbl.htmlFor === 'apiPath') lbl.textContent = t.apiPathLabel;
      if (lbl.htmlFor === 'apiKey') lbl.textContent = t.apiKeyLabel;
      if (lbl.htmlFor === 'skillInput') lbl.textContent = t.inputJson;
    });
    const resultLabel = pgSection.querySelectorAll('label');
    resultLabel.forEach((lbl) => {
      if (!lbl.htmlFor) lbl.textContent = t.result;
    });
    const pgActions = pgSection.querySelectorAll('.hero-actions button');
    if (pgActions[0]) pgActions[0].textContent = t.runSkill;
    if (pgActions[1]) pgActions[1].textContent = t.loadExample;
  }

  const ossSection = document.getElementById('oss');
  if (ossSection) {
    ossSection.querySelector('.section-head h2').textContent = t.ossTitle;
    ossSection.querySelector('.section-head .tag').textContent = t.ossTag;
  }

  document.getElementById('langToggle').textContent = t.langSwitch;
}

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
  refs.installHint.textContent = skill.install?.command || 'Use Playground: choose a skill, then click "Run Skill".';
}

function renderExcluded() {
  const list = state.catalog.exclusions?.skills || [];
  refs.excludedList.innerHTML = list
    .map((x) => `<li><a href="${x.url}" target="_blank" rel="noreferrer">${x.slug}</a></li>`)
    .join('');
}

function renderSkills() {
  const t = T();
  refs.skillsGrid.innerHTML = state.catalog.skills
    .map(
      (s) => `
      <article class="card">
        <small>${s.category}</small>
        <h3>${s.name}</h3>
        <div>${s.summary}</div>
        <div class="muted">${s.overlapPolicy}</div>
        ${
          s.sourceAttribution
            ? `<div class="muted">${t.source}: ${
                s.sourceUrl
                  ? `<a href="${s.sourceUrl}" target="_blank" rel="noreferrer">${s.sourceAttribution}</a>`
                  : s.sourceAttribution
              }</div>`
            : ''
        }
        ${
          s.sourceXHandle
            ? `<div class="muted">${t.xProfile}: ${
                s.sourceXUrl
                  ? `<a href="${s.sourceXUrl}" target="_blank" rel="noreferrer">${s.sourceXHandle}</a>`
                  : s.sourceXHandle
              }</div>`
            : ''
        }
        <code>${s.install?.command || ''}</code>
        <button class="btn ghost" data-skill-id="${s.id}">${t.runInPlayground}</button>
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
  const t = T();
  refs.ossGrid.innerHTML = state.catalog.openSourceCandidates
    .map(
      (x) => `
      <article class="card">
        <h3>${x.name}</h3>
        <div class="muted">${x.why}</div>
        <div>${t.adaptation}: ${x.adaptPlan}</div>
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

    applyStaticI18n();

    document.getElementById('langToggle').addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'zh' : 'en';
      localStorage.setItem('skillsbrain-locale', currentLang);
      applyStaticI18n();
      renderSkills();
      renderOss();
    });
  } catch (err) {
    refs.resultBox.textContent = `Boot failed: ${err.message}`;
    refs.healthBadge.textContent = 'Boot Failed';
    refs.healthBadge.classList.add('err');
  }
}

boot();
