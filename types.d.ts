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
}

export interface ProgressTrackerProps {
  progressId: string;
  initialSeason: number;
  initialEpisode: number;
}

export interface ChatInterfaceProps {
  initialMessages: Message[];
  franchiseId: string;
  franchiseTitle: string;
  franchiseType: string;
  currentSeason: number;
  currentEpisode: number;
}

export interface Message {
  role: "user" | "model" | "system";
  content: string;
  isSystem?: boolean;
}
