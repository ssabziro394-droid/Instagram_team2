"use client";

import { useCallback, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ProfileGrid from "@/components/profile/ProfileGrid";
import ProfileHeader from "@/components/profile/ProfileHeader";
import {
  useGetMyProfileQuery,
  useUpdateUserProfileMutation,
} from "@/store/api/profileApi";
import type { UpdateUserProfileRequest } from "@/types/profile";

export default function ProfilePage() {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const profileQuery = useGetMyProfileQuery();
  const [updateUserProfile, updateState] = useUpdateUserProfileMutation();

  const handleRetry = useCallback(() => {
    void profileQuery.refetch();
  }, [profileQuery]);

  const handleSaveProfile = useCallback(
    async (values: UpdateUserProfileRequest) => {
      setActionError("");

      try {
        await updateUserProfile(values).unwrap();
        setIsEditOpen(false);
        void profileQuery.refetch();
      } catch {
        setActionError("Не удалось сохранить изменения профиля.");
      }
    },
    [profileQuery, updateUserProfile]
  );

  if (profileQuery.isError) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="h-10 w-10 text-zinc-500" />
        <div>
          <h1 className="text-xl font-semibold text-white">
            Не удалось загрузить профиль
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Данные профиля временно недоступны.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          <RefreshCw className="h-4 w-4" />
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-black text-white">
      <ProfileHeader
        profile={profileQuery.data ?? null}
        isLoading={profileQuery.isLoading || profileQuery.isFetching}
        onEdit={() => setIsEditOpen(true)}
      />

      {actionError && (
        <div className="mx-auto max-w-4xl px-4 pt-4 text-sm text-red-400 sm:px-8">
          {actionError}
        </div>
      )}

      <ProfileGrid posts={profileQuery.data?.posts ?? []} />

      {isEditOpen && profileQuery.data && (
        <EditProfileModal
          profile={profileQuery.data}
          isSaving={updateState.isLoading}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
