"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { CommunityRow } from "@/components/community-row/community-row";
import { EditProfileDialog } from "@/components/edit-profile-dialog/edit-profile-dialog";
import { useUsuario } from "@/hooks/useUsuario";
import { useCommunities } from "@/app/communities-context";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTranslations } from "next-intl";

export default function ProfilePage() {
  const { user, loading: loadingAuth } = useRequireAuth();
  const { usuario, loading: loadingUser, refresh } = useUsuario();
  const { communities, fetchCommunities } = useCommunities();
  const t = useTranslations("profile");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (user) void fetchCommunities();
  }, [user, fetchCommunities]);

  if (loadingAuth || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--ff-bg)]">
        <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
      </div>
    );
  }

  const avatarUrl =
    usuario?.avatar_url ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;
  const displayName =
    usuario?.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Voce";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const username = usuario?.username ?? null;

  return (
    <>
      <HubAtmosphere
        coverUrl={avatarUrl}
        seed={usuario?.id || user.id}
        soft
      />
      {loadingUser ? (
        <div className="relative z-[1] flex min-h-screen w-full items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
        </div>
      ) : (
        <>
          <AppShell className="relative z-[1] bg-transparent">
            <div className="mb-8 flex justify-end">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                {t("edit")}
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="relative h-[112px] w-[112px] overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white/35">
                    {initial}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="ff-display truncate text-4xl font-medium tracking-tight text-white md:text-5xl">
                  {displayName}
                </h1>
                {username ? (
                  <p className="mt-2 truncate text-base text-white/40">
                    @{username}
                  </p>
                ) : null}
              </div>
            </div>

            <section className="mt-14">
              <h2 className="ff-display text-2xl font-medium tracking-tight text-white/50 md:text-3xl">
                {t("communities")}
              </h2>

              {communities.length === 0 ? (
                <p className="mt-6 text-sm text-white/35">{t("communitiesEmpty")}</p>
              ) : (
                <div className="mt-6 flex flex-col gap-1">
                  {communities.map((community) => (
                    <CommunityRow key={community.id} community={community} />
                  ))}
                </div>
              )}
            </section>
          </AppShell>

          <EditProfileDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            userId={user.id}
            name={displayName}
            username={username}
            avatarUrl={avatarUrl}
            onSaved={() => {
              void refresh();
            }}
          />
        </>
      )}
    </>
  );
}
