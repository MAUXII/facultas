"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell/app-shell";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { CommunityRow } from "@/components/community-row/community-row";
import { EditProfileDialog } from "@/components/edit-profile-dialog/edit-profile-dialog";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs";
import { useUsuario } from "@/hooks/useUsuario";
import { useCommunities } from "@/app/communities-context";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTranslations } from "next-intl";
import { routes } from "@/lib/routes";

function ProfileOverview({
  displayName,
  username,
  communityCount,
}: {
  displayName: string;
  username: string | null;
  communityCount: number;
}) {
  const t = useTranslations("profile");

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-4 text-sm font-medium text-white/70">{t("title")}</h2>
        <div className="flex flex-col gap-3 text-[15px] font-light leading-relaxed text-white/60">
          <p>
            <span className="text-white/35">Nome · </span>
            {displayName}
          </p>
          {username ? (
            <p>
              <span className="text-white/35">Username · </span>@{username}
            </p>
          ) : (
            <p className="text-white/30">Sem username ainda.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-white/70">
          {t("communities")}
        </h2>
        {communityCount === 0 ? (
          <div className="py-6">
            <p className="text-sm text-white/40">{t("communitiesEmpty")}</p>
            <Link
              href={routes.discover}
              data-snd="select"
              className="mt-4 inline-flex items-center gap-2 rounded-[12px] bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/92"
            >
              <Users className="h-4 w-4" strokeWidth={1.5} />
              Explorar comunidades
            </Link>
          </div>
        ) : (
          <p className="text-[15px] font-light text-white/55">
            Você participa de{" "}
            <span className="font-medium text-white/80">{communityCount}</span>{" "}
            {communityCount === 1 ? "comunidade" : "comunidades"}.
          </p>
        )}
      </section>
    </div>
  );
}

function CommunitiesPanel({
  communities,
}: {
  communities: ReturnType<typeof useCommunities>["communities"];
}) {
  const t = useTranslations("profile");

  if (communities.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-white/45">{t("communitiesEmpty")}</p>
        <Link
          href={routes.discover}
          data-snd="select"
          className="mt-4 inline-flex items-center gap-2 rounded-[12px] bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/92"
        >
          <Users className="h-4 w-4" strokeWidth={1.5} />
          Explorar comunidades
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {communities.map((community) => (
        <CommunityRow key={community.id} community={community} />
      ))}
    </div>
  );
}

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
  const nameParts = displayName.trim().split(/\s+/).slice(0, 2);
  const initials =
    nameParts
      .map((part: string) => part.charAt(0).toUpperCase())
      .join("") || initial;
  const username = usuario?.username ?? null;
  const handle = username ? `@${username}` : "Sem username";

  return (
    <>
      <HubAtmosphere coverUrl={avatarUrl} seed={usuario?.id || user.id} />
      {loadingUser ? (
        <div className="relative z-[1] flex min-h-screen w-full items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
        </div>
      ) : (
        <>
          <AppShell className="relative z-[1] bg-transparent">
            <div className="flex flex-col gap-10">
              <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-36 w-36 shrink-0 rounded-[18px] object-cover bg-white/10 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.85)] sm:h-44 sm:w-44 sm:rounded-[20px]"
                  />
                ) : (
                  <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-[18px] bg-white/[0.07] text-3xl font-medium tracking-tight text-white/70 sm:h-44 sm:w-44 sm:rounded-[20px] sm:text-4xl">
                    {initials}
                  </div>
                )}

                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="ff-display text-[2rem] font-medium leading-none tracking-tight text-white sm:text-[2.5rem]">
                        {displayName}
                      </h1>
                      <p className="mt-2 text-[15px] text-white/40">{handle}</p>
                    </div>
                    <LiquidGlass className="shrink-0 !rounded-full">
                      <button
                        type="button"
                        data-snd="select"
                        onClick={() => setEditOpen(true)}
                        className="px-4 py-2 text-sm font-medium text-white/85 transition hover:text-white"
                      >
                        {t("editMode")}
                      </button>
                    </LiquidGlass>
                  </div>
                </div>
              </header>

              <MagneticTabs
                defaultValue="profile"
                size="lg"
                glass
                contentBoxed={false}
                items={[
                  {
                    value: "profile",
                    label: t("title"),
                    content: (
                      <ProfileOverview
                        displayName={displayName}
                        username={username}
                        communityCount={communities.length}
                      />
                    ),
                  },
                  {
                    value: "communities",
                    label: t("communities"),
                    badge: communities.length,
                    content: <CommunitiesPanel communities={communities} />,
                  },
                ]}
              />
            </div>
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
