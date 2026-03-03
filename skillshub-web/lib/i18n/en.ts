const en = {
  // TopBar
  topbar: {
    brand: 'SKILLS',
    brandHighlight: 'BRAIN',
    navStrategies: 'STRATEGIES',
    navSkills: 'SKILLS',
    navPlayground: 'PLAYGROUND',
    navOss: 'OSS',
    systemOnline: 'SYSTEM ONLINE',
  },

  // Hero
  hero: {
    badge: 'Binance / BSC Skills Hub',
    titleLine1: 'INTELLIGENCE',
    titleLine2: 'UNLEASHED',
    subtitle: 'Modular on-chain skills for the Binance Smart Chain ecosystem.',
    subtitleLine2: 'Build, test, and deploy — all from one hub.',
    ctaPlayground: 'LAUNCH PLAYGROUND',
  },

  // StrategyPanel
  strategy: {
    title: 'DIFFERENTIATED LAUNCH TRACKS',
    subtitle: 'Skills excluded from the initial launch to maintain differentiation. Planned for Phase-2.',
    phaseTag: 'PHASE-2',
  },

  // SkillsGrid
  skills: {
    title: 'STARTER SKILLS PACK',
    subtitle: 'Production-ready skill modules with standardized interfaces. Install, configure, and run in minutes.',
    modulesLabel: 'MODULES',
    availableNow: 'Available Now',
    github: 'GITHUB',
    details: 'DETAILS',
    tryIt: 'TRY IT',
  },

  // Playground
  playground: {
    title: 'SKILL PLAYGROUND',
    subtitle: 'Configure parameters, execute skills, and inspect outputs — all in your browser.',
    selectSkill: 'Select Skill',
    apiBase: 'API Base (Optional)',
    apiPath: 'API Path',
    apiKey: 'API Key (Optional)',
    install: 'Install',
    inputJson: 'Input JSON',
    runSkill: 'Run Skill',
    processing: 'Processing...',
    outputConsole: 'Output Console',
    success: 'SUCCESS',
    error: 'ERROR',
    readyToExecute: 'Ready to execute...',
  },

  // InstallGuide
  install: {
    title: 'START BUILDING LOCALLY',
    subtitle: 'Every skill runs standalone via npx. No setup required — just pick a module and go.',
    copied: 'Copied!',
    clickToCopy: 'Click to Copy',
    step1: 'Pick Skill',
    step2: 'Run with npx',
    step3: 'Fork & Extend',
  },

  // OssIntake
  oss: {
    title: 'OPEN SOURCE INTAKE',
    subtitle: 'Curated open-source projects being adapted for the BSC skill ecosystem.',
    intakeTrack: 'Internal Intake Track',
  },

  // SkillDetail page
  skillDetail: {
    backToIndex: '← Back to Skills Index',
    installCommand: 'Install Command',
    exampleInput: 'Example Input',
    tryInPlayground: 'Try in Playground',
    openInGithub: 'Open in GitHub',
    viewAllSkills: 'View All Skills',
  },

  // Footer
  footer: {
    copyright: 'SKILLSHUB. ALL SYSTEMS OPERATIONAL.',
  },

  // Language switcher
  lang: {
    switchLabel: 'EN / 中',
  },
} as const;

export type TranslationKeys = typeof en;
export default en;
