"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { FranchiseInput, PopulatedLibraryItem, TMDBResult } from "@/types";
import { connectToDatabase } from "@/app/lib/db";
import { Franchise } from "@/app/lib/models/Franchise";
import { UserProgress } from "@/app/lib/models/UserProgress";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function getTrending(): Promise<FranchiseInput[]> {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
    next: { revalidate: 3600 },
  };

  const trendingUrl = `${TMDB_BASE_URL}/trending/all/day?language=en-US`;
  const animeUrl = `${TMDB_BASE_URL}/discover/tv?include_adult=false&language=en-US&page=1&sort_by=popularity.desc&with_genres=16&with_original_language=ja`;

  const [trendingRes, animeRes] = await Promise.all([
    fetch(trendingUrl, options),
    fetch(animeUrl, options),
  ]);
  if (!trendingRes.ok || !animeRes.ok) {
    console.error("Failed to fetch trending data");
    return [];
  }

  const trendingData = await trendingRes.json();
  const animeData = await animeRes.json();

  const rawTrending: TMDBResult[] = trendingData.results.filter(
    (item: TMDBResult) => item.media_type !== "person",
  );

  const rawAnime: TMDBResult[] = animeData.results.map((item: TMDBResult) => ({
    ...item,
    media_type: "tv",
  }));

  const combinedRaw = [...rawTrending, ...rawAnime];

  const uniqueRaw = Array.from(
    new Map(combinedRaw.map((item) => [item.id, item])).values(),
  );

  const sortedRaw = uniqueRaw.sort(
    (a, b) => (b.popularity || 0) - (a.popularity || 0),
  );

  return sortedRaw.slice(0, 10).map(
    (item: TMDBResult): FranchiseInput => ({
      tmdbId: item.id,
      title: item.title || item.name || "Unknown Title",
      type: item.media_type === "movie" ? "Movie" : "TV",
      description: item.overview,
      coverImage: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
    }),
  );
}

export async function searchFranchise(
  query: string,
  page: number = 1,
): Promise<FranchiseInput[]> {
  if (!query) return [];

  const url = `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=${page}`;

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
    next: { revalidate: 86400 },
  };

  const res = await fetch(url, options);

  if (!res.ok) {
    console.error("TMDB Fetch Error:", res.statusText);
    throw new Error("Failed to fetch from TMDB");
  }

  const data = await res.json();

  return data.results
    .filter(
      (item: TMDBResult) =>
        item.media_type === "tv" || item.media_type === "movie",
    )
    .map((item: TMDBResult) => ({
      tmdbId: item.id,
      title: item.title || item.name || "Unknown Title",
      type: item.media_type === "tv" ? "TV" : "Movie",
      description: item.overview,
      coverImage: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      releaseDate: item.release_date || item.first_air_date,
    }));
}

export async function getUserLibrary(): Promise<PopulatedLibraryItem[]> {
  const { userId } = await auth();
  if (!userId) return [];

  await connectToDatabase();

  const library = await UserProgress.find({ userId })
    .populate("franchiseId")
    .sort({ updatedAt: -1 })
    .lean();

  return library.map(
    (item): PopulatedLibraryItem => ({
      _id: item._id.toString(),
      userId: item.userId,
      franchiseId: {
        _id: item.franchiseId._id.toString(),
        tmdbId: item.franchiseId.tmdbId,
        title: item.franchiseId.title,
        type: item.franchiseId.type,
        description: item.franchiseId.description,
        coverImage: item.franchiseId.coverImage,
      },
      currentSeason: item.currentSeason,
      currentEpisode: item.currentEpisode,
      status: item.status,
    }),
  );
}

export async function addFranchiseToLibrary(franchiseData: FranchiseInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  let franchise = await Franchise.findOne({ tmdbId: franchiseData.tmdbId });

  if (!franchise) {
    franchise = await Franchise.create({
      tmdbId: franchiseData.tmdbId,
      title: franchiseData.title,
      type: franchiseData.type,
      description: franchiseData.description,
      coverImage: franchiseData.coverImage,
    });
  }

  await UserProgress.findOneAndUpdate(
    { userId, franchiseId: franchise._id },
    {
      $setOnInsert: {
        userId,
        franchiseId: franchise._id,
        currentSeason: 1,
        currentEpisode: 1,
        status: "Watching",
      },
    },
    { upsert: true, new: true },
  );

  revalidatePath("/");
  return { success: true, franchiseId: franchise._id.toString() };
}

export async function updateProgress(
  progressId: string,
  updates: { currentSeason?: number; currentEpisode?: number; status?: string },
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const updated = await UserProgress.findOneAndUpdate(
    { _id: progressId, userId },
    { $set: updates },
    { new: true },
  );

  if (!updated) throw new Error("Progress not found");

  revalidatePath(`/franchise/${updated.franchiseId}`);
  revalidatePath("/");

  return { success: true };
}
