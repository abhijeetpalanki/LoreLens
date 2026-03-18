"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { UpdateQuery } from "mongoose";

import {
  FranchiseInput,
  PopulatedLibraryItem,
  TMDBResult,
  TMDBSeason,
} from "@/types";
import { connectToDatabase } from "@/app/lib/db";
import { Franchise } from "@/app/lib/models/Franchise";
import { IUserProgress, UserProgress } from "@/app/lib/models/UserProgress";
import { ChatMessage } from "@/app/lib/models/ChatMessage";

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

  const library = await UserProgress.find({
    userId,
    status: { $nin: ["Completed", "Archived"] },
  })
    .populate("franchiseId")
    .sort({ updatedAt: -1 })
    .lean();

  const franchiseIds = library.map((item) => item.franchiseId._id);

  const chatHistories = await ChatMessage.distinct("franchiseId", {
    userId,
    franchiseId: { $in: franchiseIds },
  });

  const franchisesWithHistory = new Set(
    chatHistories.map((id) => id.toString()),
  );

  return library.map((item): PopulatedLibraryItem => {
    const franchiseIdStr = item.franchiseId._id.toString();
    const hasHistory = franchisesWithHistory.has(franchiseIdStr);
    const isAtStart = item.currentSeason === 1 && item.currentEpisode === 1;

    return {
      _id: item._id.toString(),
      userId: item.userId,
      franchiseId: {
        _id: franchiseIdStr,
        tmdbId: item.franchiseId.tmdbId,
        title: item.franchiseId.title,
        type: item.franchiseId.type,
        description: item.franchiseId.description,
        coverImage: item.franchiseId.coverImage,
      },
      currentSeason: item.currentSeason,
      currentEpisode: item.currentEpisode,
      status: item.status,
      isRewatching: hasHistory && isAtStart,
    };
  });
}

export async function addFranchiseToLibrary(franchiseData: FranchiseInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const seasonMap: Record<number, number> = {};
  if (franchiseData.type === "TV") {
    const res = await fetch(
      `${TMDB_BASE_URL}/tv/${franchiseData.tmdbId}?language=en-US`,
      { headers: { Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}` } },
    );
    const details = await res.json();

    details.seasons.forEach((s: TMDBSeason) => {
      if (s.season_number > 0) {
        seasonMap[s.season_number] = s.episode_count;
      }
    });
  }

  const franchise = await Franchise.findOneAndUpdate(
    { tmdbId: franchiseData.tmdbId },
    {
      ...franchiseData,
      seasonMap,
    },
    { upsert: true, new: true },
  );

  const existingProgress = await UserProgress.findOne({
    userId,
    franchiseId: franchise._id,
  });

  let updatePayload: UpdateQuery<IUserProgress> = {};

  if (!existingProgress) {
    const hasHistory = await ChatMessage.exists({
      userId,
      franchiseId: franchise._id,
    });
    updatePayload = {
      $set: {
        userId,
        franchiseId: franchise._id,
        currentSeason: 1,
        currentEpisode: 1,
        status: hasHistory ? "Watching" : "New",
        isSpoilerMode: false,
      },
    };
  } else {
    const isActuallyFinished = existingProgress.status === "Completed";

    updatePayload = {
      $set: {
        status: isActuallyFinished ? "Re-watching" : "Watching",
        currentSeason: isActuallyFinished ? 1 : existingProgress.currentSeason,
        currentEpisode: isActuallyFinished
          ? 1
          : existingProgress.currentEpisode,
        isSpoilerMode: isActuallyFinished
          ? false
          : existingProgress.isSpoilerMode,
      },
    };
  }

  await UserProgress.findOneAndUpdate(
    { userId, franchiseId: franchise._id },
    updatePayload,
    { upsert: true, new: true },
  );

  revalidatePath("/");
  return { success: true, franchiseId: franchise._id.toString() };
}

export async function archiveFranchise(progressId: string) {
  await UserProgress.findByIdAndUpdate(progressId, { status: "Archived" });
  revalidatePath("/");
}

export async function updateProgress(
  progressId: string,
  updates: { currentSeason?: number; currentEpisode?: number; status?: string },
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  const progress =
    await UserProgress.findById(progressId).populate("franchiseId");
  if (!progress) throw new Error("Progress not found");

  const seasonMap = progress.franchiseId.seasonMap;
  const newSeason = updates.currentSeason ?? progress.currentSeason;
  const newEpisode = updates.currentEpisode ?? progress.currentEpisode;

  if (seasonMap && seasonMap.has(newSeason.toString())) {
    const maxEpisodes = seasonMap.get(newSeason.toString());

    if (newEpisode > maxEpisodes) {
      // If there's a next season in the map, auto-advance
      if (seasonMap.has((newSeason + 1).toString())) {
        updates.currentSeason = newSeason + 1;
        updates.currentEpisode = 1;
      }
    }
  }

  if (!updates.status && progress.status !== "Completed") {
    updates.status = "Watching";
  }

  await UserProgress.findByIdAndUpdate(progressId, { $set: updates });
  revalidatePath(`/franchise/${progress.franchiseId._id}`);
  revalidatePath("/");

  return { success: true };
}

export async function markAsCompleted(franchiseId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  await UserProgress.findOneAndDelete(
    { userId, franchiseId },
    { $set: { status: "Completed" } },
  );

  revalidatePath("/");
  return { success: true };
}
