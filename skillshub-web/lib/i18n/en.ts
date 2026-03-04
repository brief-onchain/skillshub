const en = {
  // TopBar
  topbar: {
    brand: 'SKILLS',
    brandHighlight: 'BRAIN',
    navStrategies: 'STRATEGIES',
    navSkills: 'SKILLS',
    navPlayground: 'PLAYGROUND',
    navOss: 'OSS',
    navRoadmap: 'ROADMAP',
    systemOnline: 'SYSTEM ONLINE',
  },

  // Hero
  hero: {
    badge: 'Skills Marketplace for BSC Builders',
    titleLine1: 'INTELLIGENCE',
    titleLine2: 'UNLEASHED',
    subtitle: 'A single hub for original SkillsHub modules and curated open-source skills.',
    subtitleLine2: 'Find, install, and run what your team needs in one place.',
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
    title: 'SKILL MARKETPLACE',
    subtitle: 'Original builds plus curated open-source skills, organized for practical BSC use.',
    modulesLabel: 'MODULES',
    availableNow: 'Available Now',
    github: 'GITHUB',
    details: 'DETAILS',
    tryIt: 'TRY IT',
    source: 'Source',
    maintainedBy: 'Maintained by',
    provenanceOriginal: 'ORIGINAL',
    provenanceCurated: 'CURATED',
    provenanceAdapted: 'ADAPTED',
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
    provenance: 'Provenance',
    source: 'Source',
    license: 'License',
    maintainedBy: 'Maintained by',
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
};

export type TranslationKeys = typeof en;
export default en;
