export interface SchoolRuleArticle {
  id: string;
  label: string;
  body: string;
  notes?: string;
  relatedIds?: string[];
}

export interface SchoolRuleSection {
  id: string;
  title: string;
  order: number;
  summary?: string;
  articles: SchoolRuleArticle[];
}

export interface SchoolRule {
  id: string;
  chapterId: string;
  title: string;
  summary?: string;
  order: number;
  sections?: SchoolRuleSection[];
  articles?: SchoolRuleArticle[];
  pdfUrl: string;
  sourcePage?: string;
  lastUpdated?: string;
}

export interface SchoolRuleChapter {
  id: string;
  title: string;
  order: number;
  ruleIds: string[];
}

export interface SchoolRulesPayload {
  version: string;
  generatedAt: string;
  chapters: SchoolRuleChapter[];
  rules: SchoolRule[];
}

export interface RuleSearchResult {
  ruleId: string;
  chapterId: string;
  title: string;
  summary?: string;
  matchedText?: string;
  matchType: 'title' | 'summary' | 'article';
  articleLabel?: string;
}
