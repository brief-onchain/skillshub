import type { TranslationKeys } from './en';

const zh: TranslationKeys = {
  // TopBar
  topbar: {
    brand: 'SKILLS',
    brandHighlight: 'BRAIN',
    navStrategies: '策略',
    navSkills: '技能',
    navPlayground: '试验场',
    navOss: '开源',
    navRoadmap: '路线图',
    systemOnline: '系统在线',
  },

  // Hero
  hero: {
    badge: 'BSC 开发者技能市场',
    titleLine1: '链上智能',
    titleLine2: '模块释放',
    subtitle: '原创 SkillsHub 模块 + 精选开源技能，统一在一个入口。',
    subtitleLine2: '按需查找、安装、运行，团队协作更快。',
    ctaPlayground: '启动试验场',
  },

  // StrategyPanel
  strategy: {
    title: '差异化发布路线',
    subtitle: '为保持差异化竞争力，以下技能从首发中排除，计划在第二阶段推出。',
    phaseTag: '第二阶段',
  },

  // SkillsGrid
  skills: {
    title: '技能大集合',
    subtitle: '原创能力与精选开源技能一起展示，面向 BSC 实战场景。',
    modulesLabel: '个模块',
    availableNow: '现已可用',
    github: 'GITHUB',
    details: '详情',
    tryIt: '试一试',
    source: '来源',
    xProfile: 'X',
    maintainedBy: '维护方',
    provenanceOriginal: '原创',
    provenanceCurated: '精选',
    provenanceAdapted: '适配',
  },

  // Playground
  playground: {
    title: '技能试验场',
    subtitle: '配置参数、执行技能、查看输出 — 全在浏览器中完成。',
    selectSkill: '选择技能',
    apiBase: 'API 地址（可选）',
    apiPath: 'API 路径',
    apiKey: 'API 密钥（可选）',
    install: '安装命令',
    inputJson: '输入 JSON',
    runSkill: '运行技能',
    processing: '处理中...',
    outputConsole: '输出控制台',
    success: '成功',
    error: '错误',
    readyToExecute: '等待执行...',
  },

  // InstallGuide
  install: {
    title: '本地开始构建',
    subtitle: '每个技能都可通过 npx 独立运行。无需配置 — 选个模块就能跑。',
    copied: '已复制！',
    clickToCopy: '点击复制',
    step1: '选择技能',
    step2: '用 npx 运行',
    step3: 'Fork 并扩展',
  },

  // OssIntake
  oss: {
    title: '开源项目引入',
    subtitle: '正在适配到 BSC 技能生态的精选开源项目。',
    intakeTrack: '内部引入通道',
  },

  // SkillDetail page
  skillDetail: {
    backToIndex: '← 返回技能列表',
    installCommand: '安装命令',
    exampleInput: '示例输入',
    provenance: '归属类型',
    source: '来源',
    xProfile: 'X',
    license: '许可',
    maintainedBy: '维护方',
    tryInPlayground: '在试验场中试用',
    openInGithub: '在 GitHub 中打开',
    viewAllSkills: '查看所有技能',
  },

  // Footer
  footer: {
    copyright: 'SKILLSHUB · 全部系统运行正常',
  },

  // Language switcher
  lang: {
    switchLabel: 'EN / 中',
  },
};

export default zh;
