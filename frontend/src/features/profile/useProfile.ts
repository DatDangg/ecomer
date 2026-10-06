import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMyProfile, updateMyProfile, type UserProfile } from "@/api/users";
import { useAuthStore } from "@/stores/auth.store";

export const profileQueryKey = ["users", "me"] as const;

/** Loads the signed-in user's profile for the `/profile` screen. */
export function useMyProfile() {
  return useQuery<UserProfile>({
    queryKey: profileQueryKey,
    queryFn: getMyProfile,
  });
}

/**
 * Updates only the editable profile fields, then syncs the auth store so the
 * header and other surfaces reflect the new name immediately.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation<UserProfile, Error, Parameters<typeof updateMyProfile>[0]>({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey, profile);
      setUser({
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
        shopName: profile.shopName,
        phone: profile.phone ?? undefined,
        address: profile.address ?? undefined,
      });
    },
  });
}
