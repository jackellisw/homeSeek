"use client";

import { useEffect, useRef, useState } from "react";
import { HashRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Film,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  Tv,
} from "lucide-react";
import { AUTH_STORAGE_KEY } from "@/lib/auth";
import { defaultAppLinks, hydrateAppLinks, type AppLink } from "@/lib/apps";
import type { MediaItem } from "@/lib/plex";
import type { StoredAppLink } from "@/lib/link-data";

type AuthState = {
  authenticated: boolean;
  username: string;
};

type MediaResponse = {
  movies: MediaItem[];
  shows: MediaItem[];
  source: "plex" | "mock";
  message?: string;
};

const categoryOrder = ["Media", "Downloads", "Infra", "Observability"] as const;

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function useAppLinks() {
  const [links, setLinks] = useState<AppLink[]>(defaultAppLinks);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [linkError, setLinkError] = useState("");
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let active = true;
    const timers = saveTimers.current;

    fetch("/api/links")
      .then((response) => (response.ok ? (response.json() as Promise<{ links: StoredAppLink[] }>) : null))
      .then((body) => {
        if (active && body) {
          setLinks(hydrateAppLinks(body.links));
        }
      })
      .catch(() => {
        if (active) {
          setLinkError("Could not load saved links.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingLinks(false);
        }
      });

    return () => {
      active = false;
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  function setSaving(id: string, saving: boolean) {
    setSavingIds((current) => {
      if (saving) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((savingId) => savingId !== id);
    });
  }

  function updateLink(id: string, href: string) {
    setLinks((current) => {
      return current.map((link) => (link.id === id ? { ...link, href } : link));
    });

    setLinkError("");
    setSaving(id, true);
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      fetch(`/api/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ href }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Could not save link.");
          }
        })
        .catch(() => {
          setLinkError("Could not save one of the links.");
        })
        .finally(() => {
          setSaving(id, false);
        });
    }, 350);
  }

  return { isLoadingLinks, linkError, links, savingIds, updateLink };
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const localAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);

    fetch("/api/auth/session")
      .then((response) => {
        if (!response.ok) {
          throw new Error("No session");
        }
        return response.json() as Promise<{ user: { username: string } }>;
      })
      .then((session) => {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session.user));
        setAuth({ authenticated: true, username: session.user.username });
      })
      .catch(() => {
        if (localAuth) {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
        setAuth({ authenticated: false, username: "" });
      });
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "home", password }),
    });

    if (!response.ok) {
      setError("That password did not unlock the dashboard.");
      setIsSubmitting(false);
      return;
    }

    const body = (await response.json()) as { user: { username: string } };
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(body.user));
    setAuth({ authenticated: true, username: body.user.username });
    setPassword("");
    setIsSubmitting(false);
  }

  if (!auth) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </main>
    );
  }

  if (!auth.authenticated) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-lg border border-white/10 bg-zinc-950/72 p-6 shadow-2xl shadow-black/40 backdrop-blur"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/[0.03]">
              <Shield className="h-5 w-5 text-sky-300" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">HomeSeek</h1>
              <p className="text-sm text-zinc-500">Private dashboard login</p>
            </div>
          </div>

          <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-md border border-white/10 bg-black/30 pl-10 pr-3 text-sm outline-none ring-0 transition focus:border-sky-400/60 focus:bg-black/50"
              placeholder="Default: homeseek"
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Unlock
          </button>
        </form>
      </main>
    );
  }

  return children;
}

function AppChrome({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.reload();
  }

  return (
    <div className="min-h-screen px-4 py-4 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 bg-zinc-950/58 px-4 py-3 backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-white text-zinc-950 shadow-lg shadow-sky-950/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-5">HomeSeek</p>
              <p className="text-xs text-zinc-500">Server command center</p>
            </div>
          </Link>

          <nav className="flex h-10 items-center gap-1 rounded-md border border-white/10 bg-black/24 p-1 text-sm">
            <Link
              to="/"
              className={classNames(
                "inline-flex h-8 items-center gap-2 rounded px-3 text-zinc-400 transition hover:text-white",
                location.pathname === "/" && "bg-white/8 text-white",
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/settings"
              className={classNames(
                "inline-flex h-8 items-center gap-2 rounded px-3 text-zinc-400 transition hover:text-white",
                location.pathname === "/settings" && "bg-white/8 text-white",
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>

          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function DashboardPage() {
  const { isLoadingLinks, linkError, links } = useAppLinks();
  const [media, setMedia] = useState<MediaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMedia(showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }
    const response = await fetch("/api/plex/recent");
    if (response.ok) {
      setMedia((await response.json()) as MediaResponse);
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    fetch("/api/plex/recent")
      .then((response) => (response.ok ? (response.json() as Promise<MediaResponse>) : null))
      .then((nextMedia) => {
        if (active && nextMedia) {
          setMedia(nextMedia);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const grouped = categoryOrder.map((category) => ({
    category,
    links: links.filter((link) => link.category === category),
  }));

  return (
    <AppChrome>
      <main className="flex flex-col gap-6">
        <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <div className="rounded-lg border border-white/10 bg-zinc-950/54 p-5 backdrop-blur-xl">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-xs font-medium text-sky-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Local first, Plex aware
                </p>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your server, at a glance.</h1>
              </div>
              <button
                type="button"
                onClick={() => void loadMedia()}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.03]"
              >
                <RefreshCw className={classNames("h-4 w-4", loading && "animate-spin")} />
                Refresh Plex
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {grouped.map((group) => (
                <div key={group.category} className="rounded-md border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">{group.category}</p>
                  <p className="mt-2 text-2xl font-semibold">{group.links.length}</p>
                  <p className="mt-1 text-sm text-zinc-500">configured services</p>
                </div>
              ))}
            </div>
            {isLoadingLinks || linkError ? (
              <p className="mt-4 text-sm text-zinc-500">{isLoadingLinks ? "Loading saved links..." : linkError}</p>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-zinc-950/54 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-zinc-300">Plex status</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md border border-white/10 bg-black/20">
                <Film className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="font-medium">{media?.source === "plex" ? "Connected" : "Using sample media"}</p>
                <p className="text-sm text-zinc-500">
                  {media?.source === "plex" ? "Recently added feed is live." : media?.message || "Configure Plex to go live."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {links.map((app) => (
            <a
              key={app.id}
              href={app.href}
              target="_blank"
              rel="noreferrer"
              className="group rounded-lg border border-white/10 bg-zinc-950/54 p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-zinc-900/72"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={classNames("grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br", app.accent)}>
                  <app.icon className="h-5 w-5 text-black/80" />
                </div>
                <ExternalLink className="h-4 w-4 text-zinc-600 transition group-hover:text-zinc-300" />
              </div>
              <h2 className="mt-4 font-medium">{app.name}</h2>
              <p className="mt-1 min-h-10 text-sm leading-5 text-zinc-500">{app.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-500">
                <span>{app.category}</span>
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </div>
            </a>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <MediaRail title="Recently Added Movies" icon={Film} items={media?.movies || []} loading={loading} />
          <MediaRail title="Recently Added TV Shows" icon={Tv} items={media?.shows || []} loading={loading} />
        </section>
      </main>
    </AppChrome>
  );
}

function MediaRail({
  title,
  icon: Icon,
  items,
  loading,
}: {
  title: string;
  icon: typeof Film;
  items: MediaItem[];
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/54 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-sky-300" />
          <h2 className="font-medium">{title}</h2>
        </div>
        <span className="text-xs text-zinc-500">{items.length} items</span>
      </div>
      {loading ? (
        <div className="grid h-56 place-items-center rounded-md border border-white/10 bg-black/20">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <article key={item.id} className="flex gap-3 rounded-md border border-white/10 bg-black/20 p-3">
              <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded bg-zinc-900">
                {item.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.posterUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,#27272a,#0f172a_55%,#075985)]">
                    <span className="text-xl font-semibold text-white/70">{index + 1}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 py-1">
                <h3 className="truncate text-sm font-medium text-zinc-100">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">{item.subtitle}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                  {item.year ? <span>{item.year}</span> : null}
                  {item.duration ? <span>{item.duration}</span> : null}
                  {item.rating ? <span>{item.rating}</span> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsPage() {
  const { isLoadingLinks, linkError, links, savingIds, updateLink } = useAppLinks();

  return (
    <AppChrome>
      <main className="rounded-lg border border-white/10 bg-zinc-950/54 p-5 backdrop-blur-xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">Service URLs are saved to SQLite and shared across browsers.</p>
        </div>

        {isLoadingLinks || linkError ? (
          <div className="mb-4 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-400">
            {isLoadingLinks ? "Loading saved links..." : linkError}
          </div>
        ) : null}

        <div className="grid gap-3">
          {links.map((link) => (
            <label key={link.id} className="grid gap-2 rounded-md border border-white/10 bg-black/20 p-4 md:grid-cols-[12rem_1fr] md:items-center">
              <span className="flex items-center gap-3 text-sm font-medium text-zinc-300">
                <span className={classNames("grid h-8 w-8 place-items-center rounded bg-gradient-to-br", link.accent)}>
                  <link.icon className="h-4 w-4 text-black/80" />
                </span>
                {link.name}
              </span>
              <input
                value={link.href}
                onChange={(event) => updateLink(link.id, event.target.value)}
                className="h-10 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none transition focus:border-sky-400/60"
              />
              {savingIds.includes(link.id) ? <span className="text-xs text-zinc-500 md:col-start-2">Saving...</span> : null}
            </label>
          ))}
        </div>
      </main>
    </AppChrome>
  );
}

export function DashboardRouter() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // React Router's HashRouter needs the browser location, so it mounts after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </main>
    );
  }

  return (
    <HashRouter>
      <AuthGate>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthGate>
    </HashRouter>
  );
}
