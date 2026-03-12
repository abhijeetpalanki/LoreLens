export interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  media_type: "tv" | "movie" | "person";
  overview: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
}

export interface FranchiseInput {
  tmdbId: number;
  title: string;
  type: "TV" | "Movie" | "Anime";
  description: string;
  coverImage: string | null;
  releaseDate?: string;
}

export interface PopulatedLibraryItem {
  _id: string;
  userId: string;
  franchiseId: {
    _id: string;
    tmdbId: number;
    title: string;
    type: string;
    description: string;
    coverImage: string | null;
  };
  currentSeason: number;
  currentEpisode: number;
  status: string;
  isRewatching: boolean;
}

export interface ProgressTrackerProps {
  progressId: string;
  initialSeason: number;
  initialEpisode: number;
  seasonMap: Record<string, number>;
}

export interface ChatInterfaceProps {
  initialMessages: Message[];
  franchiseId: string;
  franchiseTitle: string;
  franchiseType: string;
  currentSeason: number;
  currentEpisode: number;
  activePersona: string;
  personas: Persona[];
}

export interface Message {
  role: "user" | "model" | "system";
  content: string;
  isSystem?: boolean;
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
  vote_average: number;
}

export interface Persona {
  name: string;
  emoji: string;
}

export interface PersonaDockProps {
  activePersona: string;
  onSelect: (name: string) => void;
  personas: Persona[];
}

export interface FranchiseClientProps {
  franchise: {
    _id: string;
    title: string;
    description: string;
    coverImage: string;
    type: "Movie" | "TV Show";
    seasonMap?: Record<string, number>;
  };
  progress: {
    _id: string;
    currentSeason: number;
    currentEpisode: number;
  };
  chatHistory: Message[];
}
