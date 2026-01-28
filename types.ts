
export interface LinkedInPost {
  content: string;
  date: string;
  url: string;
}

export interface Contact {
  contactId: string; // Internal UUID for row tracking
  contactName: string;
  designation: string;
  contactLinkedIn: string;
  email: string;
  phone: string;
  latestLinkedInPost?: LinkedInPost | null;
  outreachSuggestion?: string; // Individualized ice breaker
  roleValidationNote?: string;
  isVerified: boolean;
}

export interface NewsArticle {
  title: string;
  url: string;
}

export interface SWOT {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}

export interface PainPoint {
    painPoint: string;
    suggestedSolution: string;
}

export interface Lead {
  companyName: string;
  category: string;
  companyLinkedIn: string;
  justification: string;
  marketEntrySignals: string[];
  leadScore: number;
  contacts: Contact[];
  employeeCount?: string;
  latestFunding?: string;
  techStack?: string[];
  competitors?: string[];
  swotAnalysis?: SWOT;
  painPointAnalysis?: PainPoint[];
  latestNews?: NewsArticle;
}

export interface SearchQuery {
    clientName: string;
    category: string;
    department: string[];
    region: string;
    searchPlatforms: string[];
    includeSimilarCompanies: boolean;
    generateOutreachCadence: boolean;
    exclusionList: string;
    outreachTone: string;
    isAiSaas?: boolean;
}

export interface ScoreExplanation {
    explanation: string;
    bulletPoints: string[];
}

export interface CompetitorAnalysis {
  analysis: string;
  marketShare: string;
  recentNews: NewsArticle;
}

export interface StoredSession {
  leads: Lead[];
  query: SearchQuery;
}
