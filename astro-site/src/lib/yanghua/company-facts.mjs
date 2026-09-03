export const APPROVAL_APPROVED = 'approved';
export const APPROVAL_NEEDED = 'approval_needed';

const COMPANY_NAME = 'Yanghua Cable';
const COMPANY_URL = 'https://www.yhflexiblebusbar.com';
const COMPANY_EMAIL = 'info@yhflexiblebusbar.com';
const COMPANY_PHONE = '+86-769-3893-9888';
const COMPANY_ADDRESS = {
  lineOne: 'Dongguan, Guangdong, China',
  city: 'Dongguan',
  state: 'Guangdong',
  country: 'CN',
};

const EVIDENCE_GRADE_ORDER = ['A', 'B', 'C', 'D', 'E'];

function normalizeBaseUrl(siteUrl) {
  return String(siteUrl || COMPANY_URL).replace(/\/+$/, '');
}

export function normalizeEvidenceGrade(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return EVIDENCE_GRADE_ORDER.includes(normalized) ? normalized : 'E';
}

export function normalizeApprovalStatus(value) {
  return String(value || '').trim().toLowerCase() === APPROVAL_APPROVED
    ? APPROVAL_APPROVED
    : APPROVAL_NEEDED;
}

function fact(value, options = {}) {
  return {
    value,
    approvalStatus: normalizeApprovalStatus(options.approvalStatus ?? APPROVAL_NEEDED),
    evidenceGrade: normalizeEvidenceGrade(options.evidenceGrade),
    note: typeof options.note === 'string' ? options.note : '',
  };
}

export const COMPANY_FACTS = {
  identity: {
    name: fact(COMPANY_NAME, { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'A' }),
    legalName: fact(COMPANY_NAME, { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'A' }),
    url: fact(COMPANY_URL, { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'A' }),
    logoPath: fact('/favicon.svg', { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'A' }),
    description: fact(
      'Flexible busbar and cable solutions for industrial electrification, energy storage, photovoltaics, EV charging, and high-current power distribution projects.',
      { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'B' }
    ),
    aboutPath: fact('/en/about', { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'A' }),
  },
  contact: {
    email: fact(COMPANY_EMAIL, { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'A' }),
    phone: fact(COMPANY_PHONE, { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'A' }),
    addressLineOne: fact(COMPANY_ADDRESS.lineOne, { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'A' }),
    city: fact(COMPANY_ADDRESS.city, { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'A' }),
    state: fact(COMPANY_ADDRESS.state, { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'A' }),
    country: fact(COMPANY_ADDRESS.country, { approvalStatus: APPROVAL_APPROVED, evidenceGrade: 'A' }),
  },
  schema: {
    alternateNames: fact([], {
      approvalStatus: APPROVAL_NEEDED,
      evidenceGrade: 'E',
      note: 'Do not publish alternate brand names until explicitly approved.',
    }),
    foundingDate: fact('', {
      approvalStatus: APPROVAL_NEEDED,
      evidenceGrade: 'E',
      note: 'No approved founding date is stored locally.',
    }),
    numberOfEmployees: fact(null, {
      approvalStatus: APPROVAL_NEEDED,
      evidenceGrade: 'E',
      note: 'Do not publish employee ranges without approval.',
    }),
    sameAs: fact([], {
      approvalStatus: APPROVAL_NEEDED,
      evidenceGrade: 'E',
      note: 'Social profile URLs are not approved for public schema output.',
    }),
  },
  offerings: {
    serviceName: fact('Flexible busbar and cable solutions', {
      approvalStatus: APPROVAL_APPROVED,
      evidenceGrade: 'B',
    }),
  },
  legal: {
    privacy: {
      approvalStatus: APPROVAL_NEEDED,
      dataPath: 'astro-site/src/data/legacy-content/content/pages/en/privacy.json',
    },
    terms: {
      approvalStatus: APPROVAL_NEEDED,
      dataPath: 'astro-site/src/data/legacy-content/content/pages/en/terms.json',
    },
  },
};

export function isApprovedFact(entry) {
  return normalizeApprovalStatus(entry?.approvalStatus) === APPROVAL_APPROVED;
}

export function getApprovedFactValue(entry, fallback) {
  return isApprovedFact(entry) ? entry?.value : fallback;
}

export function getPublicCompanyProfile(siteUrl) {
  const baseUrl = normalizeBaseUrl(siteUrl);

  return {
    name: getApprovedFactValue(COMPANY_FACTS.identity.name, COMPANY_NAME),
    legalName: getApprovedFactValue(COMPANY_FACTS.identity.legalName, COMPANY_NAME),
    url: getApprovedFactValue(COMPANY_FACTS.identity.url, baseUrl),
    logoUrl: `${baseUrl}${getApprovedFactValue(COMPANY_FACTS.identity.logoPath, '/favicon.svg')}`,
    description: getApprovedFactValue(
      COMPANY_FACTS.identity.description,
      'Flexible busbar and cable solutions for industrial electrification, energy storage, photovoltaics, EV charging, and power distribution projects.'
    ),
    aboutUrl: `${baseUrl}${getApprovedFactValue(COMPANY_FACTS.identity.aboutPath, '/en/about')}`,
    email: getApprovedFactValue(COMPANY_FACTS.contact.email, COMPANY_EMAIL),
    phone: getApprovedFactValue(COMPANY_FACTS.contact.phone, COMPANY_PHONE),
    address: {
      streetAddress: getApprovedFactValue(COMPANY_FACTS.contact.addressLineOne, COMPANY_ADDRESS.lineOne),
      addressLocality: getApprovedFactValue(COMPANY_FACTS.contact.city, COMPANY_ADDRESS.city),
      addressRegion: getApprovedFactValue(COMPANY_FACTS.contact.state, COMPANY_ADDRESS.state),
      addressCountry: getApprovedFactValue(COMPANY_FACTS.contact.country, COMPANY_ADDRESS.country),
    },
    offeringName: getApprovedFactValue(COMPANY_FACTS.offerings.serviceName, 'Flexible busbar and cable solutions'),
    alternateNames: getApprovedFactValue(COMPANY_FACTS.schema.alternateNames, []),
    foundingDate: getApprovedFactValue(COMPANY_FACTS.schema.foundingDate, ''),
    numberOfEmployees: getApprovedFactValue(COMPANY_FACTS.schema.numberOfEmployees, null),
    sameAs: getApprovedFactValue(COMPANY_FACTS.schema.sameAs, []),
    pendingApprovals: {
      foundingDate: COMPANY_FACTS.schema.foundingDate.note,
      numberOfEmployees: COMPANY_FACTS.schema.numberOfEmployees.note,
      alternateNames: COMPANY_FACTS.schema.alternateNames.note,
      sameAs: COMPANY_FACTS.schema.sameAs.note,
      legal: COMPANY_FACTS.legal,
    },
  };
}
