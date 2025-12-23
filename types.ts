
export interface Contact {
  contactName: string;
  designation: string;
  contactLinkedIn: string;
}

export interface NewsArticle {
  title: string;
  url: string;
}

export interface InstagramPost {
  caption: string;
  url: string;
}

export interface SWOT {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}

export interface OutreachStep {
    step: number;
    subject: string;
    body: string;
}

export interface CompetitorAnalysis {
    analysis: string;
    marketShare: string;
    recentNews: NewsArticle;
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
  email: string;
  phone: string;
  contacts: Contact[];
  leadScore: number;
  outreachSuggestion: string;
  employeeCount: string;
  latestFunding: string;
  techStack: string[];
  competitors: string[];
  swotAnalysis: SWOT;
  painPointAnalysis?: PainPoint[];
  instagramProfileUrl?: string;
  latestNews?: NewsArticle;
  latestIndiaNews?: NewsArticle;
  outreachCadence?: OutreachStep[];
  latestInstagramPosts?: InstagramPost[];
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

export interface StoredSession {
    leads: Lead[];
    query: SearchQuery;
}

export interface ScoreExplanation {
    explanation: string;
    bulletPoints: string[];
}
