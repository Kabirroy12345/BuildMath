export type AdNetwork = 'adsense' | 'ezoic' | 'mediavine' | 'raptive';
export type AdPosition = 'belowCalculator' | 'inContent' | 'footerSticky';

export interface AdSlotSpec {
  id: string;
  label: string;
  minHeightPx: number;
}

export interface MonetizationConfig {
  adsEnabled: boolean;
  adNetwork: AdNetwork;
  adsensePublisherId: string;
  affiliateEnabled: boolean;
  amazonAssociateTag: string;
  homeDepotImpactId: string;
  lowesAffiliateId: string;
  leadGenEnabled: boolean;
  leadGenPartnerUrl: string;
  cmpEnabled: boolean;
  affiliateDisclosureShort: string;
  adSlots: Record<AdPosition, AdSlotSpec>;
}

export const monetizationConfig: MonetizationConfig = {
  // Phase 1/Launch default: ads off until AdSense approval, switchable via single flag
  adsEnabled: false,
  adNetwork: 'adsense',
  adsensePublisherId: 'pub-XXXXXXXXXXXXXXXX',
  affiliateEnabled: true,
  amazonAssociateTag: 'buildmath-20',
  homeDepotImpactId: 'IMPACT-HD-PLACEHOLDER',
  lowesAffiliateId: 'LOWES-PLACEHOLDER',
  leadGenEnabled: false,
  leadGenPartnerUrl: '#lead-gen-placeholder',
  cmpEnabled: true,
  affiliateDisclosureShort:
    'As an Amazon Associate and Home Depot affiliate, BuildMath earns from qualifying purchases at no extra cost to you.',
  adSlots: {
    belowCalculator: {
      id: 'ad-slot-below-calculator',
      label: 'Advertisement',
      minHeightPx: 250,
    },
    inContent: {
      id: 'ad-slot-in-content',
      label: 'Advertisement',
      minHeightPx: 250,
    },
    footerSticky: {
      id: 'ad-slot-footer-sticky',
      label: 'Advertisement',
      minHeightPx: 90,
    },
  },
};
