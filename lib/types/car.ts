/** JSON shape returned by `/api/cars` and nested under saved-car items. */
export type CarJson = {
  id: string;
  slug: string;
  name: string;
  priceMinLakh: number;
  priceMaxLakh: number;
  fuelType: string;
  segment: string;
  transmission: string;
  seats: number;
  sunroof: boolean;
  safetyRating: number | null;
  avgRating: number | null;
  reviewSummary: string | null;
};

export type CarWithScore = CarJson & { score: number };
