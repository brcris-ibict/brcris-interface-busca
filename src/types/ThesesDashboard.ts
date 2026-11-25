export type ThesesSummary = {
  total: number;
  dissertations: number;
  theses: number;
  articles: number;
  institutions: number;
};

export type ThesesSummaryResponse = {
  summary: ThesesSummary;
};

export type ThesesDashboardErrorResponse = {
  error: string;
};

export type ThesisYearPoint = {
  year: number;
  dissertations: number;
  theses: number;
};

export type ThesisByYearResponse = {
  items: ThesisYearPoint[];
  incompleteYear: number | null;
};

export type ArticleYearPoint = {
  year: number;
  articles: number;
};

export type ArticlesByYearResponse = {
  items: ArticleYearPoint[];
  incompleteYear: number | null;
};

export type ThesisKeywordPoint = {
  keyword: string;
  count: number;
};

export type ThesisKeywordsResponse = {
  items: ThesisKeywordPoint[];
};

export type ThesisInstitutionPoint = {
  name: string;
  dissertations: number;
  theses: number;
};

export type ThesisInstitutionsResponse = {
  items: ThesisInstitutionPoint[];
  withInstitution: number;
  total: number;
};

export type ThesisCoursePoint = {
  name: string;
  degree: string | null;
  dissertations: number;
  theses: number;
};

export type ThesisCoursesResponse = {
  items: ThesisCoursePoint[];
  withCourse: number;
  total: number;
};

export type ThesisListItem = {
  id: string;
  title: string;
  type: string;
  year: string;
  advisor: string;
  institution: string;
  course: string;
  url: string;
};

export type ThesisListResponse = {
  items: ThesisListItem[];
  page: number;
  pageSize: number;
  total: number;
};
