'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { CertificateTemplateMeta } from '@/lib/certificate-templates';
import type {
  CertificateSignatureSlot,
  PartnerLogoPlacement,
} from '@/lib/certificate-customization';
import { defaultHeadlineForTemplate } from '@/lib/certificate-customization';

type Props = {
  template: CertificateTemplateMeta;
  /** compact = grid thumbnail; default = dialog; large = hero */
  size?: 'compact' | 'default' | 'large';
  showSampleText?: boolean;
  recipientName?: string;
  programTitle?: string;
  completionSummary?: string;
  issuedAt?: string;
  headline?: string;
  subtitle?: string;
  certifyText?: string;
  completionPhrase?: string;
  signatures?: CertificateSignatureSlot[];
  showSignatures?: boolean;
  showPeerPortalLogo?: boolean;
  showVerificationSeal?: boolean;
  partnerLogoDataUrl?: string;
  partnerLogoLabel?: string;
  partnerLogoPlacement?: PartnerLogoPlacement;
  showPartnerLogo?: boolean;
  className?: string;
};

export function CertificateTemplatePreviewArt({
  template,
  size = 'compact',
  showSampleText = false,
  recipientName,
  programTitle,
  completionSummary,
  issuedAt,
  headline,
  subtitle,
  certifyText,
  completionPhrase,
  signatures,
  showSignatures = true,
  showPeerPortalLogo = true,
  showVerificationSeal = true,
  partnerLogoDataUrl,
  partnerLogoLabel,
  partnerLogoPlacement = 'beside-peer',
  showPartnerLogo = false,
  className,
}: Props) {
  const issuedLabel = issuedAt
    ? new Date(issuedAt + (issuedAt.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(
        'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const display = {
    recipientName: recipientName || 'Alex Johnson',
    programTitle: programTitle || 'Introduction to Web Development',
    completionSummary,
    issued: issuedLabel,
    headline: headline || defaultHeadlineForTemplate(template.id),
    subtitle,
    certifyText: certifyText || 'This is to certify that',
    completionPhrase: completionPhrase || 'has successfully completed the course',
    signatures: signatures ?? [
      { signerName: '', signerTitle: 'Program Director' },
      { signerName: '', signerTitle: 'Peer Academy' },
    ],
  };
  const { preview } = template;
  const isDark =
    template.id === 'midnight-premium' || template.id === 'charcoal-executive';
  const isParchment = template.id === 'executive-diploma' || template.id === 'ivory-gold';
  const isSideStripe = template.id === 'innovation-edge';
  const hasTopBand =
    template.id === 'royal-gradient' ||
    template.id === 'ocean-teal' ||
    template.id === 'sunrise-celebrate' ||
    template.id === 'corporate-pro';

  const titleText = display.headline;

  const scale = {
    compact: {
      logo: 'h-3.5',
      portal: 'text-[6px]',
      title: 'text-[8px]',
      name: 'text-[6px]',
      body: 'text-[5px]',
      seal: 'h-4 w-4 text-[4px]',
      badge: 'text-[5px]',
      pad: 'p-3',
    },
    default: {
      logo: 'h-6',
      portal: 'text-[10px]',
      title: 'text-sm',
      name: 'text-xs',
      body: 'text-[10px]',
      seal: 'h-8 w-8 text-[7px]',
      badge: 'text-[9px]',
      pad: 'p-6',
    },
    large: {
      logo: 'h-8',
      portal: 'text-xs',
      title: 'text-lg',
      name: 'text-sm',
      body: 'text-xs',
      seal: 'h-10 w-10 text-[8px]',
      badge: 'text-[10px]',
      pad: 'p-8',
    },
  }[size];

  return (
    <div
      className={cn(
        'relative aspect-[1.414/1] w-full flex flex-col overflow-hidden rounded-sm',
        scale.pad,
        className
      )}
      style={{ background: preview.background }}
    >
      {isSideStripe && (
        <div
          className="absolute inset-y-0 left-0 w-[14%]"
          style={{
            background: `linear-gradient(180deg, ${preview.border} 0%, ${preview.secondary ?? preview.accent} 100%)`,
          }}
        />
      )}

      {hasTopBand && (
        <div
          className={cn(
            'absolute inset-x-0 top-0',
            template.id === 'corporate-pro' ? 'h-[12%]' : 'h-[28%]'
          )}
          style={{
            background:
              template.id === 'sunrise-celebrate'
                ? `linear-gradient(135deg, ${preview.accent} 0%, #ffb478 100%)`
                : template.id === 'royal-gradient'
                  ? `linear-gradient(135deg, ${preview.accent} 0%, #1d2fb5 100%)`
                  : preview.accent,
          }}
        />
      )}
      {template.id === 'corporate-pro' && (
        <div
          className="absolute inset-x-0 bottom-0 h-[8%]"
          style={{ background: preview.border }}
        />
      )}
      {template.id === 'global-partner' && (
        <>
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: preview.border }} />
          <div className="absolute inset-x-0 top-1 h-0.5" style={{ background: preview.accent }} />
          <div
            className="absolute inset-x-0 bottom-0 h-0.5"
            style={{ background: preview.secondary ?? preview.accent }}
          />
          <div className="absolute inset-x-0 bottom-0.5 h-1" style={{ background: preview.border }} />
        </>
      )}
      {template.id === 'geometric-bold' && (
        <>
          <div
            className="absolute left-0 top-0 border-l-8 border-t-8 border-transparent"
            style={{ borderTopColor: preview.accent, borderLeftColor: preview.accent }}
          />
          <div
            className="absolute right-0 bottom-0 border-r-8 border-b-8 border-transparent"
            style={{ borderBottomColor: preview.accent, borderRightColor: preview.accent }}
          />
        </>
      )}
      {(template.id === 'platinum-elite' || template.id === 'burgundy-classic') && (
        <div
          className="absolute inset-2 rounded-sm border-2 pointer-events-none"
          style={{ borderColor: preview.border }}
        />
      )}

      {template.id === 'flare-achievement' && (
        <>
          <div
            className={cn('absolute inset-x-0 top-0', size === 'compact' ? 'h-2' : 'h-3')}
            style={{ background: preview.accent }}
          />
          <div
            className={cn('absolute left-0', size === 'compact' ? 'top-2 h-2 w-2' : 'top-3 h-3 w-3')}
            style={{ background: preview.accent }}
          />
          <div
            className={cn(
              'absolute right-0 bottom-0',
              size === 'compact' ? 'h-2 w-2' : 'h-3 w-3'
            )}
            style={{ background: preview.accent }}
          />
        </>
      )}

      {(template.id === 'peer-portal-classic' || template.id === 'laurel-honors') && (
        <div
          className="absolute inset-2 rounded-sm border-2 pointer-events-none"
          style={{ borderColor: preview.border }}
        />
      )}

      {isParchment && (
        <div
          className="absolute inset-1.5 rounded-sm border-2 pointer-events-none"
          style={{ borderColor: preview.border }}
        />
      )}

      {template.id === 'laurel-honors' && (
        <div
          className="absolute left-1/2 top-[32%] h-10 w-20 -translate-x-1/2 rounded-t-full border-t-2 border-x-2 opacity-40 pointer-events-none"
          style={{ borderColor: preview.accent }}
        />
      )}

      {size !== 'compact' && (
        <div
          className="absolute inset-0 opacity-[0.04] flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <Image src="/logo.png" alt="" width={200} height={60} className="w-1/2 h-auto object-contain" />
        </div>
      )}

      <div
        className={cn(
          'relative z-10 flex flex-col items-center flex-1 justify-center text-center gap-1',
          isSideStripe && 'ml-[12%]',
          showSampleText && 'gap-2'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center gap-2',
            partnerLogoPlacement === 'below-peer' && showPartnerLogo && partnerLogoDataUrl
              ? 'flex-col'
              : 'flex-row'
          )}
        >
          {showPeerPortalLogo && (
            <Image
              src="/logo.png"
              alt="Peer Portal"
              width={160}
              height={48}
              className={cn('w-auto object-contain', scale.logo)}
            />
          )}
          {showPartnerLogo && partnerLogoDataUrl && partnerLogoPlacement !== 'footer-left' && partnerLogoPlacement !== 'footer-right' && (
            <div className="flex flex-col items-center">
              {partnerLogoLabel && (
                <span className="text-[5px] text-muted-foreground mb-0.5">{partnerLogoLabel}</span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={partnerLogoDataUrl}
                alt="Partner"
                className={cn('object-contain', size === 'compact' ? 'h-3 max-w-[40px]' : 'h-6 max-w-[72px]')}
              />
            </div>
          )}
        </div>
        {showPeerPortalLogo && (
          <span
            className={cn('font-semibold tracking-widest uppercase', scale.portal)}
            style={{ color: isDark ? '#a2b5cb' : preview.accent }}
          >
            Peer Portal
          </span>
        )}
        <span
          className={cn('font-bold leading-tight px-2', scale.title)}
          style={{ color: preview.text }}
        >
          {titleText}
        </span>
        {display.subtitle ? (
          <span
            className={cn('italic opacity-80 px-2', scale.body)}
            style={{ color: preview.text }}
          >
            {display.subtitle}
          </span>
        ) : null}

        {showSampleText ? (
          <>
            <span className={cn('opacity-80', scale.body)} style={{ color: preview.text }}>
              {display.certifyText}
            </span>
            <div
              className={cn('w-[70%] border-t border-b py-1', size === 'large' ? 'py-1.5' : '')}
              style={{ borderColor: preview.border }}
            >
              <span
                className={cn('font-bold block', size === 'large' ? 'text-base' : 'text-sm')}
                style={{ color: isDark ? '#fff' : preview.accent }}
              >
                {display.recipientName}
              </span>
            </div>
            <span className={cn('opacity-80 max-w-[90%]', scale.body)} style={{ color: preview.text }}>
              {display.completionPhrase}
            </span>
            <span
              className={cn('font-semibold max-w-[85%] line-clamp-2', scale.name)}
              style={{ color: preview.text }}
            >
              {display.programTitle}
            </span>
            {display.completionSummary ? (
              <span
                className={cn('italic max-w-[88%] line-clamp-2 opacity-75', scale.body)}
                style={{ color: preview.text }}
              >
                {display.completionSummary}
              </span>
            ) : null}
            <span className={cn('opacity-70 mt-1', scale.body)} style={{ color: preview.text }}>
              Issued on {display.issued}
            </span>
            {showSignatures && (
              <div className="flex gap-6 sm:gap-8 mt-2 opacity-80 w-full justify-center px-2">
                {display.signatures.slice(0, 2).map((sig, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-0.5 min-w-0 flex-1 max-w-[80px]"
                  >
                    <div
                      className="border-b w-full"
                      style={{ borderColor: preview.border }}
                    />
                    {sig.signerName ? (
                      <span
                        className={cn('italic truncate w-full text-center', scale.body)}
                        style={{ color: preview.text }}
                      >
                        {sig.signerName}
                      </span>
                    ) : null}
                    <span
                      className={cn('truncate w-full text-center', scale.body)}
                      style={{ color: preview.text }}
                    >
                      {sig.signerTitle}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <span className={cn('opacity-75', scale.name)} style={{ color: preview.text }}>
            Your Name
          </span>
        )}

        {showVerificationSeal &&
          (template.id === 'midnight-premium' ||
          template.id === 'peer-portal-classic' ||
          template.id === 'executive-diploma' ||
          template.id === 'royal-gradient') && (
          <span
            className={cn(
              'mt-1 flex items-center justify-center rounded-full font-bold text-white',
              scale.seal
            )}
            style={{
              background:
                template.id === 'midnight-premium' ? preview.accent : preview.border,
            }}
          >
            ✓
          </span>
        )}
      </div>

      {showPartnerLogo &&
        partnerLogoDataUrl &&
        (partnerLogoPlacement === 'footer-left' || partnerLogoPlacement === 'footer-right') && (
          <div
            className={cn(
              'absolute bottom-2 flex flex-col items-center gap-0.5',
              partnerLogoPlacement === 'footer-left' ? 'left-2' : 'right-2'
            )}
          >
            {partnerLogoLabel && (
              <span className="text-[5px] text-muted-foreground">{partnerLogoLabel}</span>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={partnerLogoDataUrl}
              alt="Partner"
              className={cn('object-contain', size === 'compact' ? 'h-3 max-w-[36px]' : 'h-5 max-w-[56px]')}
            />
          </div>
        )}

      {preview.badge && (
        <span
          className={cn(
            'absolute bottom-2 right-2 rounded px-1.5 py-0.5 font-semibold text-white',
            scale.badge
          )}
          style={{ background: preview.accent }}
        >
          {preview.badge}
        </span>
      )}

      {showSampleText && (
        <span
          className={cn('absolute bottom-2 left-0 right-0 text-center opacity-40', scale.body)}
          style={{ color: preview.text }}
        >
          Peer Portal · Peer Academy
        </span>
      )}
    </div>
  );
}
