export type CertificateTemplateId =
  | 'peer-portal-classic'
  | 'royal-gradient'
  | 'midnight-premium'
  | 'minimal-elegance'
  | 'flare-achievement'
  | 'executive-diploma'
  | 'innovation-edge'
  | 'laurel-honors'
  | 'platinum-elite'
  | 'corporate-pro'
  | 'burgundy-classic'
  | 'ocean-teal'
  | 'forest-scholar'
  | 'sunrise-celebrate'
  | 'charcoal-executive'
  | 'ivory-gold'
  | 'geometric-bold'
  | 'global-partner';

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplateId = 'peer-portal-classic';

export const CERTIFICATE_TEMPLATE_STORAGE_KEY = 'peer_academy_certificate_template';

export type CertificateTemplateMeta = {
  id: CertificateTemplateId;
  name: string;
  description: string;
  category: 'official' | 'premium' | 'modern' | 'achievement';
  preview: {
    background: string;
    border: string;
    accent: string;
    text: string;
    badge?: string;
    secondary?: string;
  };
};

export const CERTIFICATE_TEMPLATES: CertificateTemplateMeta[] = [
  {
    id: 'peer-portal-classic',
    name: 'Peer Portal Classic',
    description:
      'Official layout with Peer Portal logo, double border, corner accents, and verification seal.',
    category: 'official',
    preview: {
      background: '#ffffff',
      border: '#00139e',
      accent: '#00139e',
      text: '#000b58',
      badge: 'Official',
      secondary: '#ff1414',
    },
  },
  {
    id: 'royal-gradient',
    name: 'Royal Gradient',
    description: 'Bold royal header band, logo watermark, and centered certified seal.',
    category: 'official',
    preview: {
      background: '#ffffff',
      border: '#1d2fb5',
      accent: '#00139e',
      text: '#000b58',
      badge: 'Royal',
    },
  },
  {
    id: 'midnight-premium',
    name: 'Midnight Premium',
    description: 'Dark navy canvas with white type, logo seal, and flare verification badge.',
    category: 'premium',
    preview: {
      background: '#000b58',
      border: '#1d2fb5',
      accent: '#ff1414',
      text: '#ffffff',
      badge: 'Premium',
    },
  },
  {
    id: 'minimal-elegance',
    name: 'Minimal Elegance',
    description: 'Clean whitespace, ornamental divider, and subtle Peer Portal watermark.',
    category: 'modern',
    preview: {
      background: '#f0f3fa',
      border: '#a2b5cb',
      accent: '#00139e',
      text: '#000b58',
    },
  },
  {
    id: 'flare-achievement',
    name: 'Flare Achievement',
    description: 'Achievement ribbon, flare corners, and logo-centered verification seal.',
    category: 'achievement',
    preview: {
      background: '#ffffff',
      border: '#ff1414',
      accent: '#ff1414',
      text: '#000b58',
      badge: 'Achievement',
    },
  },
  {
    id: 'executive-diploma',
    name: 'Executive Diploma',
    description: 'Parchment-style diploma with gold frame, large logo, and official embossed seal.',
    category: 'premium',
    preview: {
      background: '#f7f4ed',
      border: '#a88c34',
      accent: '#a88c34',
      text: '#000b58',
      badge: 'Diploma',
      secondary: '#00139e',
    },
  },
  {
    id: 'innovation-edge',
    name: 'Innovation Edge',
    description: 'Modern side stripe layout with Peer Portal branding and tech-forward accents.',
    category: 'modern',
    preview: {
      background: '#ffffff',
      border: '#000b58',
      accent: '#ff1414',
      text: '#000b58',
      badge: 'Edge',
      secondary: '#00139e',
    },
  },
  {
    id: 'laurel-honors',
    name: 'Laurel Honors',
    description: 'Honors presentation with laurel motifs, distinction subtitle, and academy seal.',
    category: 'achievement',
    preview: {
      background: '#ffffff',
      border: '#00139e',
      accent: '#1d2fb5',
      text: '#000b58',
      badge: 'Honors',
    },
  },
  {
    id: 'platinum-elite',
    name: 'Platinum Elite',
    description: 'Cool platinum double frame, charcoal typography, and refined corner brackets.',
    category: 'premium',
    preview: {
      background: '#f8f9fc',
      border: '#5a6c82',
      accent: '#5a6c82',
      text: '#343a44',
      badge: 'Elite',
    },
  },
  {
    id: 'corporate-pro',
    name: 'Corporate Professional',
    description: 'Navy header and footer bands with credential tagline and certified seal.',
    category: 'official',
    preview: {
      background: '#ffffff',
      border: '#000b58',
      accent: '#000b58',
      text: '#000b58',
      badge: 'Corporate',
    },
  },
  {
    id: 'burgundy-classic',
    name: 'Burgundy Classic',
    description: 'Wine-red accents, formal double border, and traditional certificate styling.',
    category: 'premium',
    preview: {
      background: '#ffffff',
      border: '#6e1830',
      accent: '#6e1830',
      text: '#000b58',
      badge: 'Classic',
    },
  },
  {
    id: 'ocean-teal',
    name: 'Ocean Teal',
    description: 'Teal header band with crisp white body and aquatic professional tone.',
    category: 'modern',
    preview: {
      background: '#f5fcfc',
      border: '#00788c',
      accent: '#00788c',
      text: '#000b58',
      badge: 'Teal',
    },
  },
  {
    id: 'forest-scholar',
    name: 'Forest Scholar',
    description: 'Academic green palette with laurel accents and scholar verification seal.',
    category: 'achievement',
    preview: {
      background: '#f8fcf8',
      border: '#18523a',
      accent: '#18523a',
      text: '#000b58',
      badge: 'Scholar',
    },
  },
  {
    id: 'sunrise-celebrate',
    name: 'Sunrise Celebrate',
    description: 'Warm coral sunrise header celebrating achievement with bold energy.',
    category: 'achievement',
    preview: {
      background: '#ffffff',
      border: '#e65f3c',
      accent: '#e65f3c',
      text: '#000b58',
      badge: 'Celebrate',
    },
  },
  {
    id: 'charcoal-executive',
    name: 'Charcoal Executive',
    description: 'Dark charcoal canvas with white type for boardroom-ready executive credentials.',
    category: 'premium',
    preview: {
      background: '#343a44',
      border: '#a2b5cb',
      accent: '#1d2fb5',
      text: '#ffffff',
      badge: 'Executive',
    },
  },
  {
    id: 'ivory-gold',
    name: 'Ivory & Gold',
    description: 'Luxury ivory stock with gold double frame and embossed luxury seal.',
    category: 'premium',
    preview: {
      background: '#fcfaf5',
      border: '#a88c34',
      accent: '#a88c34',
      text: '#000b58',
      badge: 'Luxury',
    },
  },
  {
    id: 'geometric-bold',
    name: 'Geometric Bold',
    description: 'Royal and flare corner triangles with strong modern geometric presence.',
    category: 'modern',
    preview: {
      background: '#ffffff',
      border: '#00139e',
      accent: '#ff1414',
      text: '#000b58',
      badge: 'Bold',
      secondary: '#00139e',
    },
  },
  {
    id: 'global-partner',
    name: 'Global Partner',
    description: 'Multi-band global credential layout ideal for partner and enterprise programs.',
    category: 'official',
    preview: {
      background: '#ffffff',
      border: '#000b58',
      accent: '#00139e',
      text: '#000b58',
      badge: 'Global',
      secondary: '#1d2fb5',
    },
  },
];

export function isCertificateTemplateId(value: unknown): value is CertificateTemplateId {
  return CERTIFICATE_TEMPLATES.some((t) => t.id === value);
}

export function getCertificateTemplate(id?: string | null): CertificateTemplateMeta {
  const found = CERTIFICATE_TEMPLATES.find((t) => t.id === id);
  return found ?? CERTIFICATE_TEMPLATES[0];
}
