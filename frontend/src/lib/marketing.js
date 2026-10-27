export const heroResume = {
  id: 'marketing_hero',
  title: 'Senior Software Engineer',
  template: 'minimal',
  personal: {
    name: 'Maya Krishnan',
    role: 'Senior Software Engineer',
    email: 'maya.k@example.com',
    phone: '+91 98200 12345',
    location: 'Bengaluru, IN',
    website: 'mayak.dev',
    linkedin: 'linkedin.com/in/mayak',
  },
  summary: 'Software engineer with 6 years building reliable React and Node.js products. Led a dashboard rewrite used by 12,000 merchants and cut page-load time by 40%.',
  experience: [
    {
      id: 'hero_e1',
      role: 'Senior Software Engineer',
      company: 'Northloop',
      dates: '2022 — Present',
      bullets: [
        'Rebuilt the merchant dashboard in React and TypeScript for 12,000 weekly users.',
        'Cut p95 page load by 40% by reshaping API queries and caching hot paths.',
        'Mentored four engineers and led the frontend guild.',
      ],
    },
    {
      id: 'hero_e2',
      role: 'Software Engineer',
      company: 'Paperplane',
      dates: '2019 — 2022',
      bullets: [
        'Shipped a customer analytics product used by 4,000 teams.',
        'Introduced Playwright coverage and reduced release regressions by 60%.',
      ],
    },
  ],
  education: [{ id: 'hero_d1', school: 'NIT Trichy', degree: 'B.Tech, Computer Science', dates: '2015 — 2019' }],
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Playwright'],
  projects: [{ id: 'hero_p1', name: 'OpenBoard', detail: 'Open-source analytics dashboard with 1.2k GitHub stars.' }],
  certifications: [],
  visible: { summary: true, experience: true, education: true, skills: true, projects: true, certifications: true },
  order: ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
};

export const heroScore = {
  coverage: 92,
  band: 'Strong overlap',
  matched: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  missing: ['GraphQL'],
};
