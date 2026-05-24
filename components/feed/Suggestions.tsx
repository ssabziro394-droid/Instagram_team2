"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { decodeJWT } from "@/lib/utils";
import { getFileUrl } from "@/lib/file";
import { useGetUsersQuery } from "@/store/api/searchApi";
import { 
  useProfileGetSubscriptionsQuery,
  useProfileFollowUserMutation,
  useProfileUnfollowUserMutation,
  useGetMyProfileQuery
} from "@/store/api/profileApi";
import { Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function Suggestions() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [currentUser, setCurrentUser] = useState<{ sid: string; name: string } | null>(null);

  // Decode user JWT token on load
  useEffect(() => {
    if (typeof window !== "undefined" && token) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.sid && decoded.name) {
        setCurrentUser({ sid: decoded.sid, name: decoded.name });
      }
    }
  }, [token]);

  const { data: usersResponse, isLoading: isLoadingUsers } = useGetUsersQuery(undefined, { skip: !currentUser });
  const { data: subscriptionsResponse } = useProfileGetSubscriptionsQuery(currentUser?.sid || "", { skip: !currentUser });
  const [followUser] = useProfileFollowUserMutation();
  const [unfollowUser] = useProfileUnfollowUserMutation();

  const [loadingFollowIds, setLoadingFollowIds] = useState<Record<string, boolean>>({});
  const [initialSuggestions, setInitialSuggestions] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Handle both legacy array and new paginated object response
  const allUsers: any[] = Array.isArray(usersResponse)
    ? usersResponse
    : (usersResponse as any)?.data ?? [];
  
  // Use getMyProfile for up-to-date avatar (reflects profile picture changes instantly)
  const { data: myProfile } = useGetMyProfileQuery();
  const currentUserAvatar = myProfile?.image ?? myProfile?.avatar ?? myProfile?.avatarUrl ?? myProfile?.imageUrl ?? null;

  // Extract IDs of users we are following from the subscriptions response
  const followingIds = subscriptionsResponse?.map((u: any) => {
    if (typeof u === 'string') return u;
    // API might return different property names for the followed user's ID
    return u.followingUserId || u.subscriberId || u.userId || u.id;
  }) || [];

  // currentUserData still needed for filtering, but avatar comes from myProfile

  // Filter out the current user and users already followed ONLY ONCE to keep them in the list after follow
  useEffect(() => {
    if (allUsers.length > 0 && subscriptionsResponse && initialSuggestions.length === 0) {
      const filtered = allUsers
        .filter((user: any) => {
          const uId = user.userId || user.id;
          return uId && uId !== currentUser?.sid && !followingIds.includes(uId);
        })
        .slice(0, 5); // Limit to 5 suggestions
      setInitialSuggestions(filtered);
    }
  }, [allUsers, subscriptionsResponse, currentUser, initialSuggestions.length]);

  const handleFollowToggle = async (userId: string, isCurrentlyFollowing: boolean) => {
    setLoadingFollowIds(prev => ({ ...prev, [userId]: true }));
    try {
      if (isCurrentlyFollowing) {
        await unfollowUser({ followingUserId: userId }).unwrap();
      } else {
        await followUser({ followingUserId: userId }).unwrap();
      }
    } catch (error: any) {
      console.error("Failed to toggle follow status:", error?.data?.errors?.[0] || error?.status || JSON.stringify(error));
    } finally {
      setLoadingFollowIds(prev => ({ ...prev, [userId]: false }));
    }
  };
  return (
    <div className="w-full max-w-[320px] flex flex-col gap-5 py-4 px-2">
      {/* Current User */}
      {currentUser && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${currentUser.name.split("@")[0]}`} className="w-11 h-11 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 block hover:opacity-80 transition-opacity">
              <img
                src={getFileUrl(currentUserAvatar, "avatar")}
                alt={currentUser.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getFileUrl(null, "avatar");
                }}
              />
            </Link>
            <div className="flex flex-col">
              <Link href={`/${currentUser.name.split("@")[0]}`} className="font-semibold text-sm text-zinc-100 hover:text-zinc-300 transition-colors inline-block">
                {currentUser.name.split("@")[0]}
              </Link>
              <span className="text-xs text-zinc-500 truncate max-w-[150px]">
                {currentUser.name}
              </span>
            </div>
          </div>
          <button className="text-xs font-semibold text-sky-500 hover:text-sky-400 transition-colors">
            Switch
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 font-semibold text-sm">Suggestions for you</span>
        <button 
          onClick={() => setShowAll(!showAll)}
          className="text-zinc-200 text-xs font-semibold hover:text-zinc-400 transition-colors cursor-pointer"
        >
          {showAll ? "Show Less" : "See All"}
        </button>
      </div>

      {/* Suggestions list */}
      <div className="flex flex-col gap-3.5">
        {isLoadingUsers ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
          </div>
        ) : (showAll ? allUsers.filter((u: any) => (u.userId || u.id) !== currentUser?.sid) : initialSuggestions).length > 0 ? (
          (showAll ? allUsers.filter((u: any) => (u.userId || u.id) !== currentUser?.sid) : initialSuggestions).map((user: any) => {
            const uId = user.userId || user.id;
            const isLoading = loadingFollowIds[uId];
            const isFollowing = followingIds.includes(uId);
            
            return (
              <div key={uId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link href={`/${user.userName || "user"}`} className="w-8 h-8 rounded-full overflow-hidden border border-zinc-850 bg-zinc-900 block hover:opacity-80 transition-opacity">
                      <img
                        src={getFileUrl(user.userImage || user.avatar, "avatar")}
                        alt={user.userName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFileUrl(null, "avatar");
                        }}
                      />
                  </Link>
                  <div className="flex flex-col">
                    <Link href={`/${user.userName || "user"}`} className="font-semibold text-xs text-zinc-200 hover:text-zinc-400 transition-colors truncate max-w-[120px] inline-block">
                      {user.userName?.split("@")[0] || "User"}
                    </Link>
                    <span className="text-[10px] text-zinc-500">
                      {isFollowing ? "Following" : "Suggested for you"}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleFollowToggle(uId, isFollowing)}
                  disabled={isLoading}
                  className={`text-xs font-semibold transition-colors disabled:opacity-50 flex items-center ${
                    isFollowing 
                      ? "text-zinc-500 hover:text-zinc-400" 
                      : "text-sky-500 hover:text-sky-400"
                  }`}
                >
                  {isLoading ? "..." : (isFollowing ? (
                    <>
                      Following
                      <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                    </>
                  ) : "Follow")}
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-xs text-zinc-500 text-center py-2">
            No suggestions available.
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <div className="flex flex-col gap-3 text-[10px] text-zinc-600 mt-6 leading-relaxed">
        <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
          {["About", "Help", "Press", "API", "Jobs", "Privacy", "Terms", "Locations", "Language"].map((item, idx) => (
            <span key={idx} className="hover:underline cursor-pointer">{item}</span>
          ))}
        </div>
        <span>© 2026 INSTAGRAM CLONE FROM SOFTCLUB</span>
      </div>
    </div>
  );
}
