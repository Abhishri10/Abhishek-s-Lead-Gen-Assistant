
export interface Contact {
  contactName: string;
  designation: string;
  contactLinkedIn: string;
}

export interface NewsArticle {
  title: string;
  url: string;
}

export interface Lead {
  companyName: string;
  category: string;
  companyLinkedIn: string;
  justification: string;
  email: string;
  phone: string;
  contacts: Contact[];
  leadScore: number;
  outreachSuggestion: string;
  employeeCount: string;
  latestFunding: string;
  techStack: string[];
  competitors: string[];
  latestNews?: NewsArticle;
  latestIndiaNews?: NewsArticle;
  composedEmail?: string;
}

export interface SearchQuery {
    clientName: string;
    category: string;
    department: string;
    region: string;
    searchPlatforms: string[];
    includeSimilarCompanies: boolean;
    composeEmail: boolean;
}

export interface StoredSession {
    leads: Lead[];
    query: SearchQuery;
}