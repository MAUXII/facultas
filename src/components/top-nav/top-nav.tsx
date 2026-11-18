"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DoorOpen,
  Compass,
  CalendarDays,
  User,
  Menu,
  X,
  Plus,
  QrCode,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ProfileDialog } from "@/components/profile-dialog/profile-dialog";
import { QrCodeDialog } from "@/components/qr-code-dialog/qr-code-dialog";
import { JoinByCodeDialog } from "@/components/join-by-code/join-by-code";
import { SoundLink } from "@/components/sound-link/sound-link";
import { APP_MARK, APP_NAME } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark/brand-mark";
import { routes } from "@/lib/routes";
import { loginHref } from "@/lib/login-next";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { playRuixenClick } from "@/lib/ruixen-click";
import { useTranslations } from "next-intl";
import { GooeyPopover } from "@/components/ui/gooey-popover";
import { LiveMedia } from "@/components/live-media/live-media";
import { NotificationsBell } from "@/components/notifications-bell/notifications-bell";
import { useCommunities } from "@/app/communities-context";
import { useUsuario } from "@/hooks/useUsuario";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/features";

const ICON_STROKE = 1.5;
const ACCOUNT_MENU_WIDTH = 260;

type AccountMenuProps = {
  onJoin: () => void;
  onSettings: () => void;
  onProfile: () => void;
  onQr: () => void;
  onLogout: () => void;
  joinLabel: string;
  settingsLabel: string;
  profileLabel: string;
  qrLabel: string;
  logoutLabel: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

const LUMA_ROW =
  "flex w-full items-center rounded-[4px] px-3 py-1.5 text-left text-sm leading-[21px] text-white/[0.79] transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#95959522] focus-visible:bg-[#95959522] focus-visible:outline-none";

/**
 * Menu da conta (desktop e mobile) no padrão Luma via GooeyPopover.
 */
function AccountMenuPanel({
  onJoin,
  onSettings,
  onProfile,
  onQr,
  onLogout,
  joinLabel,
  settingsLabel,
  profileLabel,
  qrLabel,
  logoutLabel,
  name,
  email,
  avatarUrl,
}: AccountMenuProps) {
  const headerHover =
    "transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#95959522] focus-visible:bg-[#95959522] focus-visible:outline-none";
  const row = (label: string, onClick: () => void) => (
    <button
      type="button"
      role="menuitem"
      className={LUMA_ROW}
      onClick={onClick}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
  return (
    <div className="flex flex-col">
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          role="menuitem"
          onClick={onProfile}
          aria-label={`${profileLabel}: ${name}`}
          title={profileLabel}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 rounded-[4px] px-3 py-1 text-left",
            headerHover,
          )}
        >
          {avatarUrl ? (
            <LiveMedia
              src={avatarUrl}
              className="h-8 w-8 shrink-0 rounded-full object-cover shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.08)]"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
              <User
                className="h-4 w-4 text-white/70"
                strokeWidth={ICON_STROKE}
              />
            </span>
          )}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-base font-medium leading-6 text-white">
              {name}
            </span>
            {email ? (
              <span className="truncate text-[13px] leading-[19.5px] text-white/50">
                {email}
              </span>
            ) : null}
          </span>
        </button>
        {FEATURES.qr ? (
          <button
            type="button"
            role="menuitem"
            onClick={onQr}
            aria-label={qrLabel}
            title={qrLabel}
            className={cn(
              "flex w-9 shrink-0 items-center justify-center rounded-[4px] text-white/50 hover:text-white",
              headerHover,
            )}
          >
            <QrCode className="h-4 w-4" strokeWidth={ICON_STROKE} />
          </button>
        ) : null}
      </div>
      <div className="-mx-1 mt-1 border-t border-white/[0.08] pt-1" />
      {row(settingsLabel, onSettings)}
      {row(joinLabel, onJoin)}
      {row(logoutLabel, onLogout)}
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === routes.communities) {
    return (
      pathname === routes.communities ||
      pathname.startsWith(`${routes.communities}/`)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { usuario } = useUsuario();
  const t = useTranslations("nav");
  const tp = useTranslations("profile");
  const { fetchCommunities } = useCommunities();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [timeLabel, setTimeLabel] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);

  const navLinks = [
    { href: routes.communities, label: t("communities"), icon: DoorOpen },
    { href: routes.calendar, label: t("calendar"), icon: CalendarDays },
    { href: routes.discover, label: t("discover"), icon: Compass },
  ] as const;

  const isAuthPath =
    pathname === routes.login ||
    pathname === routes.signup ||
    pathname?.startsWith("/auth/") ||
    pathname?.startsWith("/i/") ||
    pathname === routes.onboarding;

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hh = now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Sao_Paulo",
      });
      setTimeLabel(`${hh} BRT`);
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const wideNav =
    pathname === routes.create ||
    pathname === routes.calendar ||
    (!!pathname &&
      pathname.startsWith(`${routes.communities}/`) &&
      pathname !== routes.communities);
  const navReady = useRef(false);

  useEffect(() => {
    const next = wideNav ? "960px" : "820px";
    const pad = wideNav ? "0px" : "16px";
    if (!navReady.current) {
      navReady.current = true;
      document.documentElement.style.setProperty("--ff-nav-w", next);
      document.documentElement.style.setProperty("--ff-content-pad-x", pad);
      return;
    }
    let timeout = 0;
    const frame = window.requestAnimationFrame(() => {
      timeout = window.setTimeout(() => {
        document.documentElement.style.setProperty("--ff-nav-w", next);
        document.documentElement.style.setProperty("--ff-content-pad-x", pad);
      }, 80);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [wideNav]);

  const closeAccount = useCallback(() => setAccountOpen(false), []);

  if (isAuthPath || loading) {
    return null;
  }

  const hrefFor = (href: string) => {
    if (user || href === routes.discover) return href;
    return loginHref(href);
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast({
        title: tp("loggedOut"),
        description: tp("loggedOutHint"),
      });
      router.push(routes.discover);
      router.refresh();
    } catch {
      toast({
        title: tp("logoutError"),
        description: tp("tryAgain"),
        variant: "destructive",
      });
    }
  };

  const iconClass = "h-4 w-4";
  const avatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    usuario?.avatar_url ||
    null;
  const accountName =
    usuario?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Você";
  const accountEmail = usuario?.email || user?.email || "";

  const openAccountMenu = () => {
    playRuixenClick("soft");
    setMobileOpen(false);
    setAccountOpen(true);
  };

  const toggleAccountMenu = () => {
    if (accountOpen) {
      closeAccount();
      return;
    }
    openAccountMenu();
  };

  const openJoin = () => {
    playRuixenClick("soft");
    setAccountOpen(false);
    setMobileOpen(false);
    setJoinOpen(true);
  };

  const openSettings = () => {
    playRuixenClick("soft");
    setAccountOpen(false);
    setMobileOpen(false);
    setSettingsOpen(true);
  };

  const openProfile = () => {
    playRuixenClick("soft");
    setAccountOpen(false);
    setMobileOpen(false);
    router.push(routes.profile);
  };

  const openQr = () => {
    playRuixenClick("soft");
    setAccountOpen(false);
    setMobileOpen(false);
    setQrOpen(true);
  };

  const accountMenuProps = {
    onJoin: openJoin,
    onSettings: openSettings,
    onProfile: openProfile,
    onQr: openQr,
    onLogout: () => void handleLogout(),
    joinLabel: t("joinCode"),
    settingsLabel: t("settings"),
    profileLabel: t("viewProfile"),
    qrLabel: t("myQr"),
    logoutLabel: tp("logout"),
    name: accountName,
    email: accountEmail,
    avatarUrl: avatar,
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter] duration-200",
          scrolled
            ? "bg-[color-mix(in_srgb,var(--ff-bg)_72%,transparent)] backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <div
          aria-hidden
          className="ff-nav-glow pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-blue-400/[0.18] to-transparent transition-opacity duration-300 [[data-ff-atmosphere=tint]_&]:opacity-0"
        />
        <nav className="relative ff-nav">
          <SoundLink
            href={user ? routes.communities : routes.discover}
            sound="soft"
            aria-label={`${APP_NAME} Home`}
            className="flex shrink-0 items-center gap-2 text-[15px] font-medium lowercase tracking-tight text-white"
          >
            <BrandMark size={22} />
            {APP_MARK}
          </SoundLink>

          <div className="ff-center-and-right">
            <div className="ff-nav-links">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const to = hrefFor(href);
                const active = isActive(pathname, href);
                return (
                  <SoundLink
                    key={href}
                    href={to}
                    sound="nav"
                    data-active={active}
                    className="ff-nav-link"
                  >
                    <Icon className={iconClass} strokeWidth={ICON_STROKE} />
                    <span>{label}</span>
                  </SoundLink>
                );
              })}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-3">
              <span className="hidden text-xs tabular-nums text-white/40 sm:inline">
                {timeLabel}
              </span>
              <SoundLink
                href={hrefFor(routes.create)}
                sound="action"
                className="hidden px-2 py-1 text-sm font-medium text-white/80 transition hover:text-white sm:inline"
              >
                {t("createGroup")}
              </SoundLink>
              {user ? (
                <>
                  <NotificationsBell />
                  <button
                    ref={accountTriggerRef}
                    type="button"
                    onClick={toggleAccountMenu}
                    className="inline-flex overflow-hidden rounded-full"
                    aria-label={t("profile")}
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                  >
                    {avatar ? (
                      <LiveMedia
                        src={avatar}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                        <User
                          className="h-3.5 w-3.5"
                          strokeWidth={ICON_STROKE}
                        />
                      </span>
                    )}
                  </button>
                  <GooeyPopover
                    open={accountOpen}
                    onClose={closeAccount}
                    anchorRef={accountTriggerRef}
                    width={ACCOUNT_MENU_WIDTH}
                    ariaLabel={t("profile")}
                    triggerContent={
                      avatar ? (
                        <LiveMedia
                          src={avatar}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <User
                          className="h-3.5 w-3.5"
                          strokeWidth={ICON_STROKE}
                        />
                      )
                    }
                  >
                    <AccountMenuPanel {...accountMenuProps} />
                  </GooeyPopover>
                </>
              ) : (
                <SoundLink
                  href={loginHref(pathname)}
                  sound="soft"
                  className="px-2 py-1 text-sm font-medium text-white/80 transition hover:text-white"
                >
                  {t("signIn")}
                </SoundLink>
              )}
              <button
                type="button"
                className="inline-flex rounded-md p-1.5 text-white/70 md:hidden"
                onClick={() => {
                  playRuixenClick("soft");
                  setAccountOpen(false);
                  setMobileOpen((v) => !v);
                }}
                aria-label={t("menu")}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" strokeWidth={ICON_STROKE} />
                ) : (
                  <Menu className="h-5 w-5" strokeWidth={ICON_STROKE} />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--ff-bg)] pt-14 md:hidden">
          <div className="flex flex-col gap-1 px-4 pt-2">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <SoundLink
                key={href}
                href={hrefFor(href)}
                sound="nav"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-white/80"
              >
                <Icon className="h-5 w-5" strokeWidth={ICON_STROKE} />
                {label}
              </SoundLink>
            ))}
            <SoundLink
              href={hrefFor(routes.create)}
              sound="action"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-white/80"
            >
              <Plus className="h-5 w-5" strokeWidth={ICON_STROKE} />
              {t("createGroup")}
            </SoundLink>
          </div>
        </div>
      )}

      {user ? (
        <>
          <ProfileDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
          <QrCodeDialog open={qrOpen} onOpenChange={setQrOpen} />
          <JoinByCodeDialog
            open={joinOpen}
            onOpenChange={setJoinOpen}
            userId={user.id}
            onJoined={(publicId, status) => {
              void fetchCommunities();
              if (status === "active") {
                router.push(routes.community(publicId));
              }
            }}
          />
        </>
      ) : null}
    </>
  );
}
