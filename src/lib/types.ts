export type VenueId = "iconsiam" | "cloud11" | "samyan" | "paragon" | "centralworld";

export interface Venue {
  id: VenueId;
  name: string;
  fullName: string;
  color: string;
}

export interface Screening {
  id: string;
  date: string; // ISO yyyy-mm-dd
  dayThai: string;
  time: string; // HH:mm, 24h
  endTime: string | null; // HH:mm, 24h
  title: string;
  year: number | null;
  venueId: VenueId;
  theater: string | null;
  durationMin: number | null;
  qna: boolean;
  note: string | null;
}

export interface ScheduleData {
  venues: Venue[];
  screenings: Screening[];
}

export type TimeOfDay = "morning" | "afternoon" | "evening" | "late";

export type DayType = "weekday" | "weekend";

export interface Filters {
  venueIds: VenueId[]; // empty = all venues
  /** Per-venue theater/hall sub-filter, e.g. { samyan: ["Theater 3"] }. Missing or empty array = all theaters for that venue. */
  theatersByVenue: Partial<Record<VenueId, string[]>>;
  timesOfDay: TimeOfDay[]; // empty = all times
  dayTypes: DayType[]; // empty = all days
  wantedTitles: string[]; // empty = all movies
  onlyPlanned: boolean;
}
