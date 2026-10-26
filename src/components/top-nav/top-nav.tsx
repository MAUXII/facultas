"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DoorOpen,
  Compass,
  CalendarDays,
  User,
  Bell,
  Menu,
  X,
  Plus,
  KeyRound,
  Settings,
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
import { GlassMenu, GlassMenuItem } from "@/components/ui/glass-menu";
import { LiveMedia } from "@/components/live-media/live-media";
import { useCommunities } from "@/app/communities-context";
import { cn } from "@/lib/utils";

const ICON_STROKE = 1.5;
const ACCOUNT_MENU_WIDTH = 220;

function AccountMenu({
  onJoin,
  onSettings,
  onProfile,
  onQr,
  joinLabel,
  settingsLabel,
  profileLabel,
  qrLabel,
}: {
  onJoin: () => void;
  onSettings: () => void;
  onProfile: () => void;
  onQr: () => void;
  joinLabel: string;
  settingsLabel: string;
  profileLabel: string;
  qrLabel: string;
}) {
  const iconClass = "size-4 shrink-0 opacity-70";

  return (
    <>
      <GlassMenuItem onClick={onProfile}>
        <User className={iconClass} strokeWidth={1.5} aria-hidden />
        {profileLabel}
      </GlassMenuItem>
      <GlassMenuItem onClick={onQr}>
        <QrCode className={iconClass} strokeWidth={1.5} aria-hidden />
        {qrLabel}
      </GlassMenuItem>
      <GlassMenuItem onClick={onJoin}>
        <KeyRound className={iconClass} strokeWidth={1.5} aria-hidden />
        {joinLabel}
      </GlassMenuItem>
      <GlassMenuItem onClick={onSettings}>
        <Settings className={iconClass} strokeWidth={1.5} aria-hidden />
        {settingsLabel}
      </GlassMenuItem>
    </>
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
  const t = useTranslations("nav");
  const tp = useTranslations("profile");
  const { fetchCommunities } = useCommunities();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountPos, setAccountPos] = useState({ x: 0, y: 0 });
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
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const openAccountMenu = () => {
    playRuixenClick("soft");
    const r = accountTriggerRef.current?.getBoundingClientRect();
    if (!r) return;
    setAccountPos({
      x: Math.max(8, r.right - ACCOUNT_MENU_WIDTH),
      y: r.bottom + 8,
    });
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

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[border-color,background-color,backdrop-filter] duration-200",
          scrolled
            ? "border-white/10 bg-[var(--ff-bg)]/55 backdrop-blur-md"
            : "border-transparent bg-transparent",
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

            <div className="flex shrink-0 items-center gap-3">
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
                  <button
                    type="button"
                    onClick={() => playRuixenClick("soft")}
                    className="hidden rounded-md p-1.5 text-white/45 transition hover:bg-white/5 hover:text-white md:inline-flex"
                    aria-label={t("notifications")}
                  >
                    <Bell className={iconClass} strokeWidth={ICON_STROKE} />
                  </button>
                  <button
                    ref={accountTriggerRef}
                    type="button"
                    data-ff-glass-menu=""
                    onClick={toggleAccountMenu}
                    className="hidden overflow-hidden rounded-full md:inline-flex"
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
                        <User className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                      </span>
                    )}
                  </button>
                  <GlassMenu
                    open={accountOpen}
                    x={accountPos.x}
                    y={accountPos.y}
                    onClose={closeAccount}
                    width={ACCOUNT_MENU_WIDTH}
                  >
                    <AccountMenu
                      onJoin={openJoin}
                      onSettings={openSettings}
                      onProfile={openProfile}
                      onQr={openQr}
                      joinLabel={t("joinCode")}
                      settingsLabel={t("settings")}
                      profileLabel={t("viewProfile")}
                      qrLabel={t("myQr")}
                    />
                  </GlassMenu>
                </>
              ) : (
                <SoundLink
                  href={loginHref(pathname)}
                  sound="soft"
                  className="hidden px-2 py-1 text-sm font-medium text-white/80 transition hover:text-white sm:inline"
                >
                  {t("signIn")}
                </SoundLink>
              )}
              <button
                type="button"
                className="inline-flex rounded-md p-1.5 text-white/70 md:hidden"
                onClick={() => {
                  playRuixenClick("soft");
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
            {user ? (
              <>
                <div className="mt-2 flex flex-col gap-0.5">
                  <AccountMenu
                    onJoin={openJoin}
                    onSettings={openSettings}
                    onProfile={openProfile}
                    onQr={openQr}
                    joinLabel={t("joinCode")}
                    settingsLabel={t("settings")}
                    profileLabel={t("viewProfile")}
                    qrLabel={t("myQr")}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="mt-4 rounded-xl px-3 py-3 text-left text-white/40"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <SoundLink
                href={loginHref(pathname)}
                sound="soft"
                onClick={() => setMobileOpen(false)}
                className="mt-4 rounded-xl px-3 py-3 text-white/80"
              >
                {t("signIn")}
              </SoundLink>
            )}
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
