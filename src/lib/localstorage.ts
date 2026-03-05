export const LAST_VISITED_PAGE_KEY = 'lastVisitedPage';
export const HEADER_DATE_FORMAT_KEY = 'headerDateFormat';

export const HEADER_DATE_FORMAT_PRESETS = {
  year_month_day: {
    label: 'Year / Month / Day',
    token: 'yyyy/MM/dd',
  },
  day_month_year: {
    label: 'Day / Month / Year',
    token: 'dd/MM/yyyy',
  },
  month_day_year: {
    label: 'Month / Day / Year',
    token: 'MM/dd/yyyy',
  },
  month_day: {
    label: 'Month Day',
    token: 'MMMM dd',
  },
  short_month_day: {
    label: 'Short Month Day',
    token: 'MMM dd',
  },
  weekday_short_month_day: {
    label: 'Weekday + Short Month Day',
    token: 'EEE, MMM dd',
  },
} as const;

export type HeaderDateFormatOption = keyof typeof HEADER_DATE_FORMAT_PRESETS;
export const HEADER_DATE_FORMAT_OPTIONS = Object.keys(HEADER_DATE_FORMAT_PRESETS) as HeaderDateFormatOption[];

export const DEFAULT_HEADER_DATE_FORMAT: HeaderDateFormatOption = 'month_day';

export const getHeaderDateFormat = (): HeaderDateFormatOption => {
  const value = localStorage.getItem(HEADER_DATE_FORMAT_KEY) as HeaderDateFormatOption | null;

  if (value && HEADER_DATE_FORMAT_OPTIONS.includes(value)) {
    return value;
  }

  localStorage.setItem(HEADER_DATE_FORMAT_KEY, DEFAULT_HEADER_DATE_FORMAT);
  return DEFAULT_HEADER_DATE_FORMAT;
}

export const setHeaderDateFormat = (format: HeaderDateFormatOption) => {
  localStorage.setItem(HEADER_DATE_FORMAT_KEY, format);
}
