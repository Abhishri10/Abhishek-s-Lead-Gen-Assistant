
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
  latestInstagramPosts?: InstagramPost[];
}

export interface SearchQuery {
    clientName: string;
    category: string;
    department: string;
    region: string;
    searchPlatforms: string[];
    includeSimilarCompanies: boolean;
    composeEmail: boolean;
    exclusionList: string;
}

export interface StoredSession {
    leads: Lead[];
    query: SearchQuery;
}