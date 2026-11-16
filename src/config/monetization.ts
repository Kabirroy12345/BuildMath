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
  // Phase 1/Launch default: all monetization flags off until accounts/IDs are approved
  adsEnabled: false,
  adNetwork: 'adsense',
  adsensePublisherId: '',
  affiliateEnabled: false,
  amazonAssociateTag: '',
  homeDepotImpactId: '',
  lowesAffiliateId: '',
  leadGenEnabled: false,
  leadGenPartnerUrl: '',
  // Keep custom banner off: Google AdSense provides a built-in certified CMP for EU/UK ad traffic
  cmpEnabled: false,
  affiliateDisclosureShort:
    'BuildMath does not currently participate in paid retailer affiliate programs; any retail links are provided solely as planning references.',
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
