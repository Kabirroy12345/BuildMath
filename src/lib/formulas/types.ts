export interface MaterialLineItem {
  id: string;
  name: string;
  quantity: number; // Rounded up to purchasable units
  exactQuantity: number; // Unrounded exact figure
  unit: string;
  unitPrice: number;
  totalLow: number;
  totalTypical: number;
  totalHigh: number;
  productId: string;
  note?: string;
}

export interface SecondaryResultItem {
  label: string;
  value: number | string;
  exactValue?: number;
  unit: string;
  highlight?: boolean;
}

export interface ComplianceCheck {
  passed: boolean;
  codeReference: string;
  message: string;
  details: string[];
}

export interface CalculationResult {
  primaryResult: {
    label: string;
    value: number; // Rounded up purchasable quantity
    exactValue: number; // Exact unrounded calculation
    unit: string;
    subtitle?: string;
  };
  secondaryResults: SecondaryResultItem[];
  materials: MaterialLineItem[];
  costEstimate: {
    low: number;
    typical: number;
    high: number;
  };
  complianceCheck?: ComplianceCheck;
  diagramData?: Record<string, number | string>;
}

export interface QuickReferenceRow {
  scenario: string;
  col1: string;
  col2: string;
  col3: string;
}
