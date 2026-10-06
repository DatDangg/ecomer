import { apiGet } from "@/lib/api-client";

/** Client-facing category contract from `GET /categories`. */
export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Public category list used by the discovery filter. */
export function listCategories(): Promise<Category[]> {
  return apiGet<Category[]>("/categories");
}
