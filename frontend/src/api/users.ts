import { apiGet, apiPatch } from "@/lib/api-client";
import type { UserRole } from "@/stores/auth.store";

/** Profile shape returned by `GET/PATCH /users/me`. */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  role: UserRole;
  shopName: string | null;
  pickupAddress: string | null;
}

/** Only these fields are editable through `PATCH /users/me`. */
export interface UpdateProfilePayload {
  fullName: string;
  phone: string;
  address: string;
}

export function getMyProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>("/users/me");
}

export function updateMyProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  return apiPatch<UserProfile>("/users/me", payload);
}
