"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { UpdateUserProfileRequest, UserProfile } from "@/types/profile";

type EditProfileModalProps = {
  profile: UserProfile;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (values: UpdateUserProfileRequest) => Promise<void> | void;
};

function getUsername(profile: UserProfile) {
  return profile.username ?? profile.userName ?? "";
}

function getFullName(profile: UserProfile) {
  return (
    profile.fullName ??
    profile.name ??
    [profile.firstName, profile.lastName].filter(Boolean).join(" ")
  );
}

function getBio(profile: UserProfile) {
  return profile.bio ?? profile.about ?? "";
}

export default function EditProfileModal({
  profile,
  isSaving = false,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(getUsername(profile));
  const [fullName, setFullName] = useState(getFullName(profile));
  const [bio, setBio] = useState(getBio(profile));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSave({
      id: profile.id,
      userId: profile.userId,
      username: username.trim(),
      userName: username.trim(),
      fullName: fullName.trim(),
      bio: bio.trim(),
      about: bio.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-black text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-base font-semibold">Edit profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            aria-label="Close edit profile"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-200">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-zinc-600"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-200">Full name</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-zinc-600"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-200">Bio</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              className="resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-zinc-600"
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
