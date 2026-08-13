import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { MapPin, Clock, Map, Database, X, KeyRound, Link2, Sparkles, MessageCircle, ArrowLeft, Check, Calendar, Users, Wifi, WifiOff, MessagesSquare, Plus, Trash2, Send } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { create } from 'zustand';

// src/config.ts
var envApi = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : void 0;
var envWs = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_WS_URL : void 0;
var config = {
  apiBase: envApi || "/api",
  wsUrl: envWs,
  tourBasePath: "/tours",
  homePath: "/"
};
function configureAiAssistant(partial) {
  config = {
    ...config,
    ...partial,
    tourBasePath: partial.tourBasePath ?? config.tourBasePath,
    homePath: partial.homePath ?? config.homePath
  };
}
function getAiConfig() {
  return config;
}
function getApiBase() {
  return config.apiBase;
}
function getTourHref(tourId, room) {
  const base = `${config.tourBasePath.replace(/\/$/, "")}/${tourId}`;
  if (!room) return base;
  return `${base}?room=${encodeURIComponent(room)}`;
}
function getWsUrl() {
  if (config.wsUrl) return config.wsUrl;
  if (typeof window === "undefined") {
    return "ws://localhost:3011/ws/assistant";
  }
  const { protocol, hostname, host } = window.location;
  const wsProto = protocol === "https:" ? "wss" : "ws";
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${wsProto}://localhost:3011/ws/assistant`;
  }
  return `${wsProto}://${host}/ws/assistant`;
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function formatPrice(price, currency = "USD") {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(price);
}
function formatNightsRu(nights) {
  const n = Math.abs(Math.trunc(nights));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} \u043D\u043E\u0447\u044C`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} \u043D\u043E\u0447\u0438`;
  return `${n} \u043D\u043E\u0447\u0435\u0439`;
}
function formatDurationLabel(duration, durationHours) {
  const m = duration.match(/(\d+)\s*nights?/i);
  if (m) return formatNightsRu(Number(m[1]));
  if (durationHours && durationHours >= 24) {
    return formatNightsRu(Math.round(durationHours / 24));
  }
  return duration;
}
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
function applyConfig(props) {
  const next = {};
  if (props.apiBase !== void 0) next.apiBase = props.apiBase;
  if (props.wsUrl !== void 0) next.wsUrl = props.wsUrl;
  if (props.tourBasePath !== void 0) next.tourBasePath = props.tourBasePath;
  if (props.homePath !== void 0) next.homePath = props.homePath;
  if (Object.keys(next).length) configureAiAssistant(next);
}
function AiAssistantProvider({
  children,
  apiBase,
  wsUrl,
  tourBasePath,
  homePath,
  shell = "page"
}) {
  applyConfig({ apiBase, wsUrl, tourBasePath, homePath });
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: false
        }
      }
    })
  );
  useEffect(() => {
    applyConfig({ apiBase, wsUrl, tourBasePath, homePath });
  }, [apiBase, wsUrl, tourBasePath, homePath]);
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "totus-ai-root",
        shell === "page" && "totus-ai-root--app",
        shell === "widget" && "totus-ai-root--widget"
      ),
      children
    }
  ) });
}

// src/lib/bookingHref.ts
function toSiteRelativeHref(href) {
  try {
    const u = new URL(href, typeof window !== "undefined" ? window.location.origin : "https://local");
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return href;
  }
}
function hotelDetailsHrefFromTour(tour) {
  if (tour.link) return toSiteRelativeHref(tour.link);
  return getTourHref(tour.id);
}
function roomBookingHref(room, hotelId) {
  if (room.booking_url) {
    let href = toSiteRelativeHref(room.booking_url);
    try {
      const u = new URL(href, "https://local");
      if (room.room_type && !u.searchParams.has("room_type")) {
        u.searchParams.set("room_type", room.room_type);
      }
      u.searchParams.delete("list_price");
      u.searchParams.delete("room_price");
      href = `${u.pathname}${u.search}${u.hash}`;
    } catch {
    }
    return href;
  }
  return getTourHref(`lt_${hotelId}`, room.room_type);
}
function Badge({
  className,
  children
}) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: cn(
        "inline-flex items-center rounded-lg border border-line bg-paper/90 px-2 py-0.5 text-xs font-medium text-ink",
        className
      ),
      children
    }
  );
}
function TourCard({ tour }) {
  const image = tour.images[0];
  return /* @__PURE__ */ jsxs("article", { className: "group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper shadow-card transition duration-300 hover:-translate-y-1 hover:border-coral/50 hover:shadow-pop", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-sand via-page to-sea-soft", children: [
      image ? /* @__PURE__ */ jsx(
        "img",
        {
          src: image,
          alt: tour.name,
          className: "h-full w-full object-cover transition duration-300 group-hover:scale-105",
          loading: "lazy"
        }
      ) : /* @__PURE__ */ jsx("span", { className: "text-6xl transition duration-300 group-hover:scale-110", children: tour.emoji }),
      /* @__PURE__ */ jsx(Badge, { className: "absolute left-3 top-3 border-transparent bg-paper/90 text-ink shadow-card", children: "\u0422\u043E\u0442\u0443\u0441 \u043A\u043B\u0443\u0431" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col gap-3 p-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-[family-name:var(--font-display)] text-lg font-semibold text-ink", children: tour.name }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 flex items-center gap-1.5 text-sm text-subtle", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "h-3.5 w-3.5 text-sea" }),
          tour.destination
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "line-clamp-2 text-sm text-subtle", children: tour.description }),
      /* @__PURE__ */ jsxs("div", { className: "mt-auto flex flex-wrap items-center gap-3 text-xs text-subtle", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5" }),
          formatDurationLabel(tour.duration, tour.duration_hours)
        ] }),
        tour.stars ? /* @__PURE__ */ jsx("span", { className: "text-coral", children: "\u2605".repeat(Math.min(tour.stars, 5)) }) : null,
        tour.rating > 0 && /* @__PURE__ */ jsxs("span", { className: "text-coral", children: [
          "\u2605 ",
          tour.rating,
          tour.review_count ? ` \xB7 ${tour.review_count}` : ""
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "ticket-stub relative mt-auto flex items-center justify-between gap-3 px-4 py-3", children: [
      /* @__PURE__ */ jsx("span", { className: "ticket-notch-top", "aria-hidden": true }),
      /* @__PURE__ */ jsx("span", { className: "ticket-notch-bottom", "aria-hidden": true }),
      /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold tabular-nums text-ink", children: [
        /* @__PURE__ */ jsx("span", { className: "mr-1 text-xs font-normal text-faint", children: "\u043E\u0442" }),
        formatPrice(tour.price, tour.currency)
      ] }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: hotelDetailsHrefFromTour(tour),
          className: "inline-flex h-9 shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-coral px-4 text-xs font-semibold text-white shadow-[0_6px_16px_rgb(255_90_60_/_0.3)] transition hover:bg-coral-deep",
          children: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435"
        }
      )
    ] })
  ] });
}
function Skeleton({ className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("animate-pulse rounded-xl bg-sand/80", className) });
}
function TourGrid({
  tours,
  isLoading
}) {
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3", children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-[12px] border border-line", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-40 w-full rounded-none" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 p-4", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-5 w-3/4" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-1/2" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-full" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-9 w-24" })
      ] })
    ] }, i)) });
  }
  if (!tours?.length) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-[420px] flex-col items-center justify-center rounded-[12px] border border-dashed border-line bg-sand/30 px-6 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-page text-sea", children: /* @__PURE__ */ jsx(Map, { className: "h-10 w-10" }) }),
      /* @__PURE__ */ jsx("h3", { className: "font-[family-name:var(--font-display)] text-xl font-semibold text-ink", children: "\u0422\u0443\u0440\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-md text-sm text-subtle", children: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B \u0438\u043B\u0438 \u0441\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430 \u0432 \u0447\u0430\u0442\u0435 \u2014 \u043E\u043D \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u0442\u044C \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u0448\u0430\u0433 \u0437\u0430 \u0448\u0430\u0433\u043E\u043C." })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3", children: tours.map((tour) => /* @__PURE__ */ jsx(TourCard, { tour }, tour.id)) });
}

// src/lib/api.ts
async function request(path, init) {
  const res = await fetch(`${getApiBase()}${path}`, {
    headers: { "Content-Type": "application/json", ...{} },
    ...init
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || text || `Request failed: ${res.status}`);
    } catch (err) {
      if (err instanceof Error && err.message !== text) throw err;
      throw new Error(text || `Request failed: ${res.status}`);
    }
  }
  return res.json();
}
function getTour(id) {
  return request(`/tours/${id}`);
}
function getSchema() {
  return request("/schema");
}
function getTourRooms(id) {
  return request(`/tours/${id}/rooms`);
}
var buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-btn)] text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-0 bg-coral text-white hover:bg-coral-deep shadow-[0_8px_20px_rgb(255_90_60_/_0.28)] hover:shadow-[0_10px_26px_rgb(255_90_60_/_0.36)]",
        secondary: "border-0 bg-sea text-white hover:bg-[#0a6a73]",
        outline: "border border-solid border-line bg-paper text-ink hover:border-coral/60 hover:text-coral",
        ghost: "border-0 bg-transparent text-subtle hover:bg-sand hover:text-ink",
        danger: "border-0 bg-danger text-white hover:bg-[#c13424]"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
var Button = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => /* @__PURE__ */ jsx("button", { ref, className: cn(buttonVariants({ variant, size }), className), ...props })
);
Button.displayName = "Button";
function SchemaVisualizer({
  open,
  onClose
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["schema"],
    queryFn: getSchema,
    enabled: open
  });
  const [selected, setSelected] = useState("tours");
  const table = useMemo(
    () => data?.find((t) => t.name === selected) ?? data?.[0],
    [data, selected]
  );
  const relations = useMemo(() => {
    if (!data || !table) return [];
    return table.columns.filter((c) => c.fk).map((c) => ({ from: `${table.name}.${c.name}`, to: c.fk }));
  }, [data, table]);
  if (!open) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-40 flex justify-end bg-page/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex h-full w-full max-w-xl flex-col border-l border-line bg-page shadow-2xl animate-fade-in-up", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between border-b border-line px-4 py-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 font-[family-name:var(--font-display)] font-semibold text-ink", children: [
          /* @__PURE__ */ jsx(Database, { className: "h-4 w-4 text-sea" }),
          "Schema Visualizer"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-subtle", children: "Admin / debug \xB7 \u0442\u0430\u0431\u043B\u0438\u0446\u044B \u0438 \u0441\u0432\u044F\u0437\u0438" })
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "icon", onClick: onClose, children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid flex-1 grid-rows-[auto_1fr] gap-4 overflow-hidden p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        isLoading && Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-9 w-24" }, i)),
        data?.map((t) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setSelected(t.name),
            className: `rounded-xl border px-3 py-2 text-sm transition ${table?.name === t.name ? "border-sea/50 bg-sea-soft text-sea" : "border-line bg-sand/80 text-ink/80 hover:border-faint"}`,
            children: t.name
          },
          t.name
        ))
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-y-auto rounded-[12px] border border-line bg-sand/60 p-4", children: table ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("h3", { className: "mb-3 font-semibold text-ink", children: table.name }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: table.columns.map((col) => /* @__PURE__ */ jsxs(
          "li",
          {
            className: "flex items-center justify-between gap-3 rounded-xl border border-line bg-page/50 px-3 py-2 text-sm",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                col.pk && /* @__PURE__ */ jsx(KeyRound, { className: "h-3.5 w-3.5 text-gold" }),
                col.fk && /* @__PURE__ */ jsx(Link2, { className: "h-3.5 w-3.5 text-sea" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-ink", children: col.name })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right text-xs text-subtle", children: [
                /* @__PURE__ */ jsx("span", { children: col.type }),
                col.pk && /* @__PURE__ */ jsx("span", { className: "ml-2 text-gold", children: "PK" }),
                col.fk && /* @__PURE__ */ jsxs("span", { className: "ml-2 text-sea", children: [
                  "FK \u2192 ",
                  col.fk
                ] }),
                col.nullable && /* @__PURE__ */ jsx("span", { className: "ml-2 text-faint", children: "null" })
              ] })
            ]
          },
          col.name
        )) }),
        relations.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-5", children: [
          /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs uppercase tracking-wide text-faint", children: "\u0421\u0432\u044F\u0437\u0438" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: relations.map((r) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center gap-2 rounded-lg border border-sea/20 bg-sea-soft px-3 py-2 text-xs text-sea",
              children: [
                /* @__PURE__ */ jsx("span", { children: r.from }),
                /* @__PURE__ */ jsx("span", { className: "text-faint", children: "\u2500\u2500\u2500" }),
                /* @__PURE__ */ jsx("span", { children: r.to })
              ]
            },
            r.from
          )) })
        ] })
      ] }) : /* @__PURE__ */ jsx(Skeleton, { className: "h-48 w-full" }) })
    ] })
  ] }) });
}
var welcome = {
  id: "welcome",
  role: "assistant",
  content: "\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435! \u042F \u041C\u0438\u043B\u0430, \u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A \xAB\u0422\u043E\u0442\u0443\u0441 \u043A\u043B\u0443\u0431\u0430\xBB \u2600\uFE0F \u041C\u043E\u0433\u0443 \u043E\u0442\u0432\u0435\u0442\u0438\u0442\u044C \u043D\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043F\u0440\u043E \u043E\u0442\u0434\u044B\u0445 \u0438 \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u0442\u044C \u0442\u0443\u0440 \u0441\u043E \u0441\u0441\u044B\u043B\u043A\u043E\u0439. \u0421\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u0447\u0442\u043E \u0443\u0433\u043E\u0434\u043D\u043E \u2014 \u0438\u043B\u0438 \u0441\u043A\u0430\u0436\u0438\u0442\u0435, \u043A\u0443\u0434\u0430 \u0445\u043E\u0442\u0438\u0442\u0435 \u043F\u043E\u0435\u0445\u0430\u0442\u044C.",
  timestamp: /* @__PURE__ */ new Date()
};
var STORAGE_KEY = "totus-chats-v1";
function reviveMessages(messages) {
  return messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp ?? Date.now()) }));
}
function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.chats) && parsed.chats.length) {
        const chats = parsed.chats.slice(-30).map((c) => ({ ...c, messages: reviveMessages(c.messages ?? []) }));
        const activeId = chats.some((c) => c.id === parsed.activeId) ? parsed.activeId : chats[chats.length - 1].id;
        return { chats, activeId };
      }
    }
  } catch {
  }
  const fresh = newChat();
  return { chats: [fresh], activeId: fresh.id };
}
function newChat() {
  return {
    id: uid("chat"),
    title: "\u041D\u043E\u0432\u044B\u0439 \u0447\u0430\u0442",
    updatedAt: Date.now(),
    messages: [{ ...welcome, id: uid("welcome"), timestamp: /* @__PURE__ */ new Date() }]
  };
}
function saveChats(chats, activeId) {
  try {
    const trimmed = chats.slice(-30).map((c) => ({ ...c, messages: c.messages.slice(-60) }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ chats: trimmed, activeId }));
  } catch {
  }
}
function titleFrom(messages) {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "\u041D\u043E\u0432\u044B\u0439 \u0447\u0430\u0442";
  const t = firstUser.content.trim().replace(/\s+/g, " ");
  return t.length > 42 ? `${t.slice(0, 42)}\u2026` : t;
}
var initial = loadChats();
var useAssistantStore = create((set, get) => ({
  isOpen: false,
  isConnected: false,
  isTyping: false,
  typingStatus: null,
  messages: initial.chats.find((c) => c.id === initial.activeId)?.messages ?? [],
  chats: initial.chats,
  activeChatId: initial.activeId,
  showChatList: false,
  streamingId: null,
  highlightedTours: [],
  showSchema: false,
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  setConnected: (connected) => set({ isConnected: connected }),
  setTyping: (typing) => set({ isTyping: typing, ...typing ? {} : { typingStatus: null } }),
  setTypingStatus: (status) => set({ typingStatus: status }),
  setShowSchema: (show) => set({ showSchema: show }),
  addMessage: (message) => {
    const id = message.id ?? uid("msg");
    set((s) => ({
      messages: [
        ...s.messages,
        {
          ...message,
          id,
          timestamp: /* @__PURE__ */ new Date()
        }
      ]
    }));
    return id;
  },
  appendToMessage: (id, chunk) => set((s) => ({
    messages: s.messages.map(
      (m) => m.id === id ? { ...m, content: m.content + chunk } : m
    )
  })),
  updateMessage: (id, patch) => set((s) => ({
    messages: s.messages.map((m) => m.id === id ? { ...m, ...patch } : m)
  })),
  setStreamingId: (id) => set({ streamingId: id }),
  setHighlightedTours: (tours) => set({ highlightedTours: tours }),
  clearMessages: () => set((s) => {
    const fresh = [{ ...welcome, id: uid("welcome"), timestamp: /* @__PURE__ */ new Date() }];
    const chats = s.chats.map(
      (c) => c.id === s.activeChatId ? { ...c, messages: fresh, title: "\u041D\u043E\u0432\u044B\u0439 \u0447\u0430\u0442", updatedAt: Date.now() } : c
    );
    return { messages: fresh, chats };
  }),
  setShowChatList: (show) => set({ showChatList: show }),
  startNewChat: () => set((s) => {
    const chat = newChat();
    return {
      chats: [...s.chats, chat],
      activeChatId: chat.id,
      messages: chat.messages,
      highlightedTours: [],
      showChatList: false
    };
  }),
  switchChat: (id) => {
    const chat = get().chats.find((c) => c.id === id);
    if (!chat) return [];
    set({
      activeChatId: id,
      messages: chat.messages,
      highlightedTours: [],
      showChatList: false,
      streamingId: null
    });
    return chat.messages;
  },
  deleteChat: (id) => set((s) => {
    const rest = s.chats.filter((c) => c.id !== id);
    if (!rest.length) {
      const chat = newChat();
      return { chats: [chat], activeChatId: chat.id, messages: chat.messages };
    }
    if (s.activeChatId !== id) return { chats: rest };
    const last = rest[rest.length - 1];
    return { chats: rest, activeChatId: last.id, messages: last.messages };
  })
}));
useAssistantStore.subscribe((state, prev) => {
  if (state.messages === prev.messages && state.chats === prev.chats) return;
  if (state.messages !== prev.messages) {
    const chats = state.chats.map(
      (c) => c.id === state.activeChatId ? {
        ...c,
        messages: state.messages,
        title: c.title === "\u041D\u043E\u0432\u044B\u0439 \u0447\u0430\u0442" ? titleFrom(state.messages) : c.title,
        updatedAt: Date.now()
      } : c
    );
    useAssistantStore.setState({ chats }, false);
    saveChats(chats, state.activeChatId);
    return;
  }
  saveChats(state.chats, state.activeChatId);
});
function AiHomePage({ autoOpenChat = true }) {
  const highlightedTours = useAssistantStore((s) => s.highlightedTours);
  const isTyping = useAssistantStore((s) => s.isTyping);
  const showSchema = useAssistantStore((s) => s.showSchema);
  const setShowSchema = useAssistantStore((s) => s.setShowSchema);
  const setOpen = useAssistantStore((s) => s.setOpen);
  const hasTours = highlightedTours.length > 0;
  useEffect(() => {
    if (autoOpenChat) setOpen(true);
  }, [autoOpenChat, setOpen]);
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-6 lg:px-6", children: [
    /* @__PURE__ */ jsxs("header", { className: "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "mb-2 text-sm font-medium uppercase tracking-[0.2em] text-sea/80", children: "\u0422\u043E\u0442\u0443\u0441 \u043A\u043B\u0443\u0431" }),
        /* @__PURE__ */ jsx("h1", { className: "font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink sm:text-3xl", children: "\u041F\u043E\u0434\u0431\u043E\u0440 \u0442\u0443\u0440\u043E\u0432 \u0441 \u041C\u0438\u043B\u043E\u0439" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-xl text-subtle", children: "\u041E\u043F\u0438\u0448\u0438\u0442\u0435 \u043E\u0442\u0434\u044B\u0445 \u0432 \u0447\u0430\u0442\u0435 \u2014 \u041C\u0438\u043B\u0430 \u043F\u043E\u0434\u0431\u0435\u0440\u0451\u0442 \u0442\u0443\u0440\u044B \u0438 \u043F\u043E\u043A\u0430\u0436\u0435\u0442 \u0438\u0445 \u0437\u0434\u0435\u0441\u044C \u0441\u043E \u0441\u0441\u044B\u043B\u043A\u0430\u043C\u0438." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => setShowSchema(true), children: [
          /* @__PURE__ */ jsx(Database, { className: "h-4 w-4" }),
          "Schema"
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "button", onClick: () => setOpen(true), children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
          "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("div", { className: "mb-4 flex items-center justify-between gap-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-subtle", children: isTyping ? "\u041C\u0438\u043B\u0430 \u043F\u043E\u0434\u0431\u0438\u0440\u0430\u0435\u0442 \u0442\u0443\u0440\u044B\u2026" : hasTours ? `\u041C\u0438\u043B\u0430 \u043D\u0430\u0448\u043B\u0430: ${highlightedTours.length} ${plural(highlightedTours.length)}` : "\u041F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E \u2014 \u0441\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u041C\u0438\u043B\u0443 \u0432 \u0447\u0430\u0442\u0435" }) }),
      hasTours || isTyping ? /* @__PURE__ */ jsx(TourGrid, { tours: highlightedTours, isLoading: isTyping && !hasTours }) : /* @__PURE__ */ jsx(EmptyState, { onOpen: () => setOpen(true) })
    ] }),
    /* @__PURE__ */ jsx(SchemaVisualizer, { open: showSchema, onClose: () => setShowSchema(false) })
  ] });
}
function plural(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "\u0442\u0443\u0440";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "\u0442\u0443\u0440\u0430";
  return "\u0442\u0443\u0440\u043E\u0432";
}
function EmptyState({ onOpen }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-[420px] flex-col items-center justify-center rounded-[12px] border border-dashed border-line bg-sand/30 px-6 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-page text-sea", children: /* @__PURE__ */ jsx(MessageCircle, { className: "h-10 w-10" }) }),
    /* @__PURE__ */ jsx("h3", { className: "font-[family-name:var(--font-display)] text-xl font-semibold text-ink", children: "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u041C\u0438\u043B\u0443" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-md text-sm text-subtle", children: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \xAB\u0422\u0443\u0440\u0446\u0438\u044F \u0432 \u043A\u043E\u043D\u0446\u0435 \u0430\u0432\u0433\u0443\u0441\u0442\u0430, \u0434\u0432\u043E\u0435 \u0432\u0437\u0440\u043E\u0441\u043B\u044B\u0445 \u0438 \u0440\u0435\u0431\u0451\u043D\u043E\u043A 5 \u043B\u0435\u0442, \u0432\u0441\u0451 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E, \u043F\u0435\u0441\u0447\u0430\u043D\u044B\u0439 \u043F\u043B\u044F\u0436\xBB. \u041C\u0438\u043B\u0430 \u043D\u0430\u0439\u0434\u0451\u0442 \u0442\u0443\u0440\u044B \u0438 \u043F\u043E\u043A\u0430\u0436\u0435\u0442 \u0438\u0445 \u0437\u0434\u0435\u0441\u044C." }),
    /* @__PURE__ */ jsxs(Button, { type: "button", className: "mt-5", onClick: onOpen, children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
      "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0447\u0430\u0442"
    ] })
  ] });
}

// src/lib/meals.ts
var MEAL_LABELS = {
  UAI: "\u0423\u043B\u044C\u0442\u0440\u0430 \u0432\u0441\u0451 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E",
  "UAI+": "\u0423\u043B\u044C\u0442\u0440\u0430 \u0432\u0441\u0451 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E",
  AI: "\u0412\u0441\u0451 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E",
  "AI+": "\u0412\u0441\u0451 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E",
  AIP: "\u0412\u0441\u0451 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E",
  FB: "\u041F\u043E\u043B\u043D\u044B\u0439 \u043F\u0430\u043D\u0441\u0438\u043E\u043D",
  "FB+": "\u041F\u043E\u043B\u043D\u044B\u0439 \u043F\u0430\u043D\u0441\u0438\u043E\u043D",
  HB: "\u041F\u043E\u043B\u0443\u043F\u0430\u043D\u0441\u0438\u043E\u043D",
  "HB+": "\u041F\u043E\u043B\u0443\u043F\u0430\u043D\u0441\u0438\u043E\u043D",
  BB: "\u0417\u0430\u0432\u0442\u0440\u0430\u043A\u0438",
  RO: "\u0411\u0435\u0437 \u043F\u0438\u0442\u0430\u043D\u0438\u044F",
  OB: "\u0411\u0435\u0437 \u043F\u0438\u0442\u0430\u043D\u0438\u044F",
  SC: "\u0411\u0435\u0437 \u043F\u0438\u0442\u0430\u043D\u0438\u044F"
};
function mealLabel(code) {
  return MEAL_LABELS[code.trim().toUpperCase()] ?? code.trim();
}
function AiTourDetailPage({
  tourId,
  selectedRoom = null
}) {
  const setOpen = useAssistantStore((s) => s.setOpen);
  const homeHref = getAiConfig().homePath || "/";
  const { data: tour, isLoading, error } = useQuery({
    queryKey: ["tour", tourId],
    queryFn: () => getTour(tourId),
    enabled: Boolean(tourId)
  });
  const bookInChat = () => {
    if (!tour) return;
    setOpen(true);
    window.dispatchEvent(
      new CustomEvent("assistant:send", {
        detail: `\u0425\u043E\u0447\u0443 \u0437\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0442\u0443\u0440 \xAB${tour.name}\xBB (${tour.id})`
      })
    );
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl space-y-4 px-4 py-8", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-40" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-56 w-full" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-10 w-2/3" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-32 w-full" })
    ] });
  }
  if (error || !tour) {
    return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-lg px-4 py-20 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-lg text-ink", children: "\u0422\u0443\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" }),
      /* @__PURE__ */ jsx("a", { href: homeHref, className: "mt-4 inline-block text-sea hover:underline", children: "\u041D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E" })
    ] });
  }
  const categoryLabel = "\u0422\u043E\u0442\u0443\u0441 \u043A\u043B\u0443\u0431";
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-6 lg:px-6", children: [
    /* @__PURE__ */ jsxs(
      "a",
      {
        href: homeHref,
        className: "mb-6 inline-flex items-center gap-2 text-sm text-subtle transition hover:text-coral",
        children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
          "\u0412\u0441\u0435 \u0442\u0443\u0440\u044B"
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-[12px] border border-line bg-paper backdrop-blur-md", children: [
      /* @__PURE__ */ jsx("div", { className: "relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-sand via-page to-sea-soft sm:h-64", children: tour.images[0] ? /* @__PURE__ */ jsx(
        "img",
        {
          src: tour.images[0],
          alt: tour.name,
          className: "h-full w-full object-cover"
        }
      ) : /* @__PURE__ */ jsx("span", { className: "text-8xl", children: tour.emoji }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-8 p-6 sm:p-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Badge, { className: "mb-2 border-line bg-sea-soft text-sea", children: categoryLabel }),
            /* @__PURE__ */ jsx("h1", { className: "font-[family-name:var(--font-display)] text-3xl font-bold text-ink", children: tour.name }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 flex items-center gap-1.5 text-subtle", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4 text-sea" }),
              tour.destination,
              " \xB7 ",
              tour.duration,
              " \xB7 \u0434\u043E ",
              tour.max_group_size,
              " \u0447\u0435\u043B."
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-gold", children: [
              "\u2605 ",
              tour.rating,
              " (",
              tour.review_count,
              " \u043E\u0442\u0437\u044B\u0432\u043E\u0432)"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-left sm:text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-semibold text-coral", children: formatPrice(tour.price, tour.currency) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-faint", children: "\u0437\u0430 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430" }),
            /* @__PURE__ */ jsx(Button, { type: "button", className: "mt-3 w-full sm:w-auto", onClick: bookInChat, children: "\u0417\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "leading-relaxed text-ink/80", children: tour.description }),
        /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsx("h2", { className: "mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-ink", children: "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430" }),
          /* @__PURE__ */ jsx("ol", { className: "relative space-y-0 border-l border-line pl-6", children: tour.itinerary.map((item, idx) => /* @__PURE__ */ jsxs("li", { className: "relative pb-6 last:pb-0", children: [
            /* @__PURE__ */ jsx("span", { className: "absolute -left-[1.9rem] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-sea/50 bg-paper", children: /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-coral" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-medium uppercase tracking-wide text-sea", children: item.time }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 font-medium text-ink", children: item.title }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-subtle", children: item.description })
          ] }, idx)) })
        ] }),
        /* @__PURE__ */ jsx(RoomTypesSection, { tourId: tour.id, selectedRoom }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-6 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("h2", { className: "mb-3 font-semibold text-ink", children: "\u0412\u043A\u043B\u044E\u0447\u0435\u043D\u043E" }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: tour.inclusions.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-ink/80", children: [
              /* @__PURE__ */ jsx(Check, { className: "mt-0.5 h-4 w-4 shrink-0 text-green-400" }),
              item
            ] }, item)) })
          ] }),
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("h2", { className: "mb-3 font-semibold text-ink", children: "\u041D\u0435 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E" }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: tour.exclusions.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-ink/80", children: [
              /* @__PURE__ */ jsx(X, { className: "mt-0.5 h-4 w-4 shrink-0 text-danger" }),
              item
            ] }, item)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsx("h2", { className: "mb-3 font-semibold text-ink", children: "\u041C\u0435\u0441\u0442\u043E \u0432\u0441\u0442\u0440\u0435\u0447\u0438" }),
          /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-[12px] border border-line bg-paper", children: /* @__PURE__ */ jsx("div", { className: "flex h-40 items-center justify-center bg-[radial-gradient(circle_at_30%_40%,rgb(255_90_60_/_0.12),transparent_50%),radial-gradient(circle_at_70%_60%,rgb(14_124_134_/_0.12),transparent_45%)]", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "mx-auto mb-2 h-8 w-8 text-sea" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-ink", children: tour.meeting_point.address }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-faint", children: [
              tour.meeting_point.lat.toFixed(3),
              ", ",
              tour.meeting_point.lng.toFixed(3)
            ] })
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsxs("h2", { className: "mb-3 flex items-center gap-2 font-semibold text-ink", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4 text-sea" }),
            "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0434\u0430\u0442\u044B"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: tour.available_dates.map((date) => /* @__PURE__ */ jsx(Badge, { className: "border-line bg-page/70 px-3 py-1.5", children: date }, date)) })
        ] }),
        /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsx("h2", { className: "mb-3 font-semibold text-ink", children: "\u041E\u0442\u0437\u044B\u0432\u044B" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: tour.reviews.map((review) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-[12px] border border-line bg-sand/70 p-4",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-ink", children: review.author }),
                  /* @__PURE__ */ jsxs("span", { className: "text-sm text-gold", children: [
                    "\u2605 ",
                    review.rating
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-ink/80", children: review.comment }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-faint", children: review.date })
              ]
            },
            review.id
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 border-t border-line pt-6", children: [
          /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 text-sm text-subtle", children: [
            /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }),
            "\u042F\u0437\u044B\u043A\u0438 \u0433\u0438\u0434\u0430: ",
            tour.guide_languages.join(", ")
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-faint", children: tour.cancellation_policy }),
          /* @__PURE__ */ jsx(Button, { type: "button", className: "ml-auto", onClick: bookInChat, children: "\u0417\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0435\u0439\u0447\u0430\u0441" })
        ] })
      ] })
    ] })
  ] });
}
function RoomTypesSection({
  tourId,
  selectedRoom
}) {
  const roomKey = selectedRoom?.toLowerCase() ?? null;
  const selectedRef = useRef(null);
  const { data, isLoading } = useQuery({
    queryKey: ["tour-rooms", tourId],
    queryFn: () => getTourRooms(tourId),
    enabled: Boolean(tourId),
    retry: false,
    staleTime: 5 * 60 * 1e3
  });
  const rooms = data?.rooms ?? [];
  const hotelId = Number(data?.hotel_id) || Number(String(tourId).replace(/^lt_/i, "")) || 0;
  useEffect(() => {
    if (roomKey && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [roomKey, rooms.length]);
  if (!isLoading && rooms.length === 0) return null;
  return /* @__PURE__ */ jsxs("section", { children: [
    /* @__PURE__ */ jsx("h2", { className: "mb-2 font-[family-name:var(--font-display)] text-xl font-semibold text-ink", children: "\u0422\u0438\u043F\u044B \u043D\u043E\u043C\u0435\u0440\u043E\u0432" }),
    /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm text-faint", children: "\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043D\u043E\u043C\u0435\u0440\u0430, \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u043F\u043E \u044D\u0442\u043E\u043C\u0443 \u0437\u0430\u043F\u0440\u043E\u0441\u0443. \u0427\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u043E\u0432, \u0432\u043E\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435\u0441\u044C \u043F\u043E\u0438\u0441\u043A\u043E\u043C \u0432\u0440\u0443\u0447\u043D\u0443\u044E." }),
    isLoading ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-16 w-full" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-16 w-full" })
    ] }) : /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: rooms.map((room) => {
      const bookingHref = hotelId ? roomBookingHref(
        {
          room_type: room.room_type,
          min_price: room.min_price,
          currency: room.currency,
          meals: room.meals,
          offers_count: room.offers_count,
          sample_tour_id: room.sample_tour_id,
          url: room.url,
          booking_url: room.booking_url
        },
        hotelId
      ) : room.booking_url || room.url || "";
      return /* @__PURE__ */ jsx(
        "li",
        {
          ref: room.room_type.toLowerCase() === roomKey ? selectedRef : void 0,
          className: `rounded-[12px] border p-4 ${room.room_type.toLowerCase() === roomKey ? "border-sea bg-sea-soft ring-1 ring-sea/40" : "border-line bg-paper"}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium text-ink", children: room.room_type }),
              /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: Object.entries(room.meals).sort((a, b) => a[1] - b[1]).map(([meal, price]) => /* @__PURE__ */ jsxs(Badge, { className: "text-ink/80", children: [
                mealLabel(meal),
                " \xB7 \u043E\u0442 ",
                formatPrice(price, room.currency)
              ] }, meal)) }),
              /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-faint", children: [
                room.offers_count,
                " ",
                room.offers_count === 1 ? "\u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435" : room.offers_count < 5 ? "\u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F" : "\u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0439",
                " ",
                "\u043E\u0442 \u0442\u0443\u0440\u043E\u043F\u0435\u0440\u0430\u0442\u043E\u0440\u043E\u0432"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-lg font-semibold text-coral", children: [
                "\u043E\u0442 ",
                formatPrice(room.min_price, room.currency)
              ] }),
              bookingHref ? /* @__PURE__ */ jsx(
                "a",
                {
                  href: bookingHref,
                  className: "mt-2 inline-block rounded-lg bg-coral px-3 py-1.5 text-sm font-semibold text-white hover:bg-coral-deep",
                  children: "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044E"
                }
              ) : null
            ] })
          ] })
        },
        room.room_type
      );
    }) })
  ] });
}
function useWebSocket(enabled = true) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const manualCloseRef = useRef(false);
  const setConnected = useAssistantStore((s) => s.setConnected);
  const setTyping = useAssistantStore((s) => s.setTyping);
  const addMessage = useAssistantStore((s) => s.addMessage);
  const appendToMessage = useAssistantStore((s) => s.appendToMessage);
  const updateMessage = useAssistantStore((s) => s.updateMessage);
  const setStreamingId = useAssistantStore((s) => s.setStreamingId);
  const setHighlightedTours = useAssistantStore((s) => s.setHighlightedTours);
  const setTypingStatus = useAssistantStore((s) => s.setTypingStatus);
  const handleMessageRef = useRef(() => {
  });
  handleMessageRef.current = (raw) => {
    let data;
    try {
      data = JSON.parse(raw.data);
    } catch {
      return;
    }
    switch (data.type) {
      case "typing":
        setTyping(true);
        break;
      case "token": {
        if (!data.content) break;
        setTyping(false);
        const store = useAssistantStore.getState();
        let id = store.streamingId;
        if (!id) {
          id = data.messageId ?? uid("assistant");
          addMessage({ id, role: "assistant", content: "" });
          setStreamingId(id);
        }
        appendToMessage(id, data.content);
        break;
      }
      case "tours":
        if (data.tours?.length) {
          setHighlightedTours(data.tours);
          const store = useAssistantStore.getState();
          const id = store.streamingId;
          if (!id) {
            const newId = data.messageId ?? uid("assistant");
            addMessage({
              id: newId,
              role: "assistant",
              content: "",
              metadata: { tour_results: data.tours }
            });
            setStreamingId(newId);
          } else {
            updateMessage(id, {
              metadata: {
                ...store.messages.find((m) => m.id === id)?.metadata,
                tour_results: data.tours
              }
            });
          }
        }
        break;
      case "rooms":
        if (data.rooms?.length && data.hotel) {
          const store = useAssistantStore.getState();
          const id = store.streamingId;
          const payload = { hotel: data.hotel, rooms: data.rooms };
          if (!id) {
            const newId = data.messageId ?? uid("assistant");
            addMessage({
              id: newId,
              role: "assistant",
              content: "",
              metadata: { room_cards: payload }
            });
            setStreamingId(newId);
          } else {
            updateMessage(id, {
              metadata: {
                ...store.messages.find((m) => m.id === id)?.metadata,
                room_cards: payload
              }
            });
          }
        }
        break;
      case "destinations":
        if (data.destinations?.length) {
          const store = useAssistantStore.getState();
          const id = store.streamingId;
          if (!id) {
            const newId = data.messageId ?? uid("assistant");
            addMessage({
              id: newId,
              role: "assistant",
              content: "",
              metadata: { destination_cards: data.destinations }
            });
            setStreamingId(newId);
          } else {
            updateMessage(id, {
              metadata: {
                ...store.messages.find((m) => m.id === id)?.metadata,
                destination_cards: data.destinations
              }
            });
          }
        }
        break;
      case "booking":
        if (data.booking) {
          const store = useAssistantStore.getState();
          const id = store.streamingId;
          if (!id) {
            const newId = data.messageId ?? uid("assistant");
            addMessage({
              id: newId,
              role: "assistant",
              content: "",
              metadata: { booking: data.booking }
            });
            setStreamingId(newId);
          } else {
            updateMessage(id, {
              metadata: {
                ...store.messages.find((m) => m.id === id)?.metadata,
                booking: data.booking
              }
            });
          }
        }
        break;
      case "tool": {
        if (!data.tool) break;
        if (data.tool.status === "running") {
          setTyping(true);
          setTypingStatus(friendlyStatus(data.tool.name));
        }
        const store = useAssistantStore.getState();
        const id = store.streamingId;
        if (id) {
          const msg = store.messages.find((m) => m.id === id);
          const calls = [...msg?.metadata?.tool_calls ?? []];
          const idx = calls.findIndex((c) => c.id && c.id === data.tool.id);
          if (idx >= 0) calls[idx] = { ...calls[idx], ...data.tool };
          else calls.push(data.tool);
          updateMessage(id, { metadata: { ...msg?.metadata, tool_calls: calls } });
        }
        break;
      }
      case "done":
        setTyping(false);
        setStreamingId(null);
        break;
      case "error":
        setTyping(false);
        setStreamingId(null);
        addMessage({
          role: "assistant",
          content: data.error ?? "\u041F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437."
        });
        break;
    }
  };
  const connect = useCallback(() => {
    if (!enabled) return;
    const existing = wsRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      if (!manualCloseRef.current) {
        reconnectRef.current = setTimeout(connect, 2e3);
      }
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (event) => handleMessageRef.current(event);
  }, [enabled, setConnected]);
  useEffect(() => {
    manualCloseRef.current = false;
    connect();
    return () => {
      manualCloseRef.current = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);
  const send = useCallback(
    (content) => {
      if (!content.trim()) return;
      addMessage({ role: "user", content: content.trim() });
      setTyping(true);
      const payload = JSON.stringify({ type: "chat", content: content.trim() });
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(payload);
      } else {
        setTyping(false);
        addMessage({
          role: "assistant",
          content: "\u041D\u0435\u0442 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u0441 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u043E\u043C. \u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0441\u0435\u0440\u0432\u0435\u0440 (`npm run server`) \u0438 \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443."
        });
      }
    },
    [addMessage, setTyping]
  );
  const reset = useCallback(() => {
    useAssistantStore.getState().clearMessages();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "reset" }));
    }
  }, []);
  const newChat2 = useCallback(() => {
    useAssistantStore.getState().startNewChat();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "reset" }));
    }
  }, []);
  const openChat = useCallback((id) => {
    const messages = useAssistantStore.getState().switchChat(id);
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    const history = messages.filter((m) => m.content.trim() && m.id !== "welcome").map((m) => ({ role: m.role, content: m.content }));
    wsRef.current.send(JSON.stringify({ type: "restore", messages: history }));
  }, []);
  const streamingId = useAssistantStore((s) => s.streamingId);
  return { send, reset, newChat: newChat2, openChat, streamingId };
}
function friendlyStatus(toolName) {
  switch (toolName) {
    case "search_tours":
      return "\u041F\u043E\u0434\u0431\u0438\u0440\u0430\u044E \u0442\u0443\u0440\u044B";
    case "get_hotel_info":
      return "\u0418\u0437\u0443\u0447\u0430\u044E \u043E\u0442\u0435\u043B\u044C";
    case "get_hotel_offers":
      return "\u0418\u0449\u0443 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u0440\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u044F";
    case "annotate_hotels":
      return "\u0414\u043E\u0431\u0430\u0432\u043B\u044F\u044E \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0438";
    case "show_destinations":
      return "\u0421\u043E\u0431\u0438\u0440\u0430\u044E \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F";
    default:
      return "\u0414\u0443\u043C\u0430\u044E";
  }
}

// src/hooks/useAssistant.ts
function useAssistant() {
  const isOpen = useAssistantStore((s) => s.isOpen);
  const isConnected = useAssistantStore((s) => s.isConnected);
  const isTyping = useAssistantStore((s) => s.isTyping);
  const messages = useAssistantStore((s) => s.messages);
  const toggleOpen = useAssistantStore((s) => s.toggleOpen);
  const setOpen = useAssistantStore((s) => s.setOpen);
  const { send, reset, newChat: newChat2, openChat } = useWebSocket(true);
  return {
    isOpen,
    isConnected,
    isTyping,
    messages,
    toggleOpen,
    setOpen,
    send,
    reset,
    newChat: newChat2,
    openChat
  };
}
var PICK_LABEL_STYLES = {
  "\u043E\u043F\u0442\u0438\u043C\u0443\u043C \u0446\u0435\u043D\u0430/\u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E": "bg-coral text-white",
  "\u0441\u0430\u043C\u0430\u044F \u043D\u0438\u0437\u043A\u0430\u044F \u0446\u0435\u043D\u0430": "bg-ok text-white",
  "\u043B\u0443\u0447\u0448\u0438\u0439 \u0440\u0435\u0439\u0442\u0438\u043D\u0433": "bg-gold text-white"
};
function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const hasContent = message.content.trim().length > 0;
  const hasCards = Boolean(message.metadata?.tour_results?.length) || Boolean(message.metadata?.room_cards?.rooms?.length) || Boolean(message.metadata?.destination_cards?.length) || Boolean(message.metadata?.booking);
  if (!hasContent && !hasCards) return null;
  return /* @__PURE__ */ jsx("div", { className: `animate-fade-in-up flex ${isUser ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: `max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isUser ? "rounded-br-md bg-ink text-white" : "rounded-bl-md border border-line bg-sand text-ink"}`,
      children: [
        hasContent && /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap", children: renderAssistantText(message.content) }),
        message.metadata?.tour_results && message.metadata.tour_results.length > 0 && /* @__PURE__ */ jsx("div", { className: `${hasContent ? "mt-3" : ""} space-y-2.5`, children: message.metadata.tour_results.map((tour) => /* @__PURE__ */ jsx(HotelCard, { tour }, tour.id)) }),
        message.metadata?.room_cards && message.metadata.room_cards.rooms.length > 0 && /* @__PURE__ */ jsxs("div", { className: `${hasContent ? "mt-3" : ""}`, children: [
          message.metadata.room_cards.hotel.name && /* @__PURE__ */ jsxs("p", { className: "mb-2 text-xs font-medium uppercase tracking-wide text-sea", children: [
            "\u041D\u043E\u043C\u0435\u0440\u0430 \xB7 ",
            message.metadata.room_cards.hotel.name
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: message.metadata.room_cards.rooms.map((room) => /* @__PURE__ */ jsx(
            RoomCardView,
            {
              room,
              hotelId: message.metadata.room_cards.hotel.id,
              hotelImage: message.metadata.room_cards.hotel.image
            },
            room.room_type
          )) }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 rounded-lg border border-line bg-sand/70 px-2.5 py-1.5 text-[11px] leading-snug text-subtle", children: "\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043D\u043E\u043C\u0435\u0440\u0430, \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u043F\u043E \u044D\u0442\u043E\u043C\u0443 \u0437\u0430\u043F\u0440\u043E\u0441\u0443. \u0427\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u043E\u0432, \u0432\u043E\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435\u0441\u044C \u043F\u043E\u0438\u0441\u043A\u043E\u043C \u0432\u0440\u0443\u0447\u043D\u0443\u044E." })
        ] }),
        message.metadata?.destination_cards && message.metadata.destination_cards.length > 0 && /* @__PURE__ */ jsx("div", { className: `${hasContent ? "mt-3" : ""} grid grid-cols-2 gap-2`, children: message.metadata.destination_cards.map((dest) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => window.dispatchEvent(
              new CustomEvent("assistant:send", { detail: `\u041D\u0430\u0439\u0434\u0438 \u0442\u0443\u0440\u044B: ${dest.name}` })
            ),
            className: "group relative overflow-hidden rounded-xl border border-line/60 text-left transition-transform hover:scale-[1.02]",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "relative h-24 w-full", children: [
                dest.image ? /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: dest.image,
                    alt: dest.name,
                    loading: "lazy",
                    className: "h-full w-full object-cover"
                  }
                ) : /* @__PURE__ */ jsx("div", { className: "h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgb(255_90_60_/_0.18),transparent_60%),radial-gradient(circle_at_75%_70%,rgb(14_124_134_/_0.16),transparent_55%)] bg-sand" }),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" }),
                /* @__PURE__ */ jsxs("div", { className: "absolute inset-x-0 bottom-0 p-2", children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold leading-tight text-ink", children: [
                    dest.emoji ? `${dest.emoji} ` : "",
                    dest.name
                  ] }),
                  dest.country && dest.country !== dest.name && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-ink/80", children: dest.country })
                ] })
              ] }),
              dest.tagline && /* @__PURE__ */ jsx("div", { className: "bg-page/70 px-2 py-1.5", children: /* @__PURE__ */ jsx("p", { className: "line-clamp-2 text-[11px] leading-snug text-ink/80", children: dest.tagline }) })
            ]
          },
          dest.name
        )) })
      ]
    }
  ) });
}
function HotelCard({ tour }) {
  const image = tour.images?.[0];
  const labelStyle = tour.pick_label ? PICK_LABEL_STYLES[tour.pick_label] ?? "bg-paper/95 text-ink" : null;
  return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-xl border border-line/60 bg-paper", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative h-32 w-full", children: [
      image ? /* @__PURE__ */ jsx("img", { src: image, alt: tour.name, loading: "lazy", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_30%,rgb(14_124_134_/_0.16),transparent_60%)] bg-sand text-3xl", children: tour.emoji }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" }),
      tour.pick_label && labelStyle && /* @__PURE__ */ jsx(
        "span",
        {
          className: `absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${labelStyle}`,
          children: tour.pick_label
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-x-0 bottom-0 p-2.5", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-semibold leading-tight text-white", children: [
          tour.name,
          tour.stars ? /* @__PURE__ */ jsx("span", { className: "ml-1 text-coral", children: "\u2605".repeat(Math.min(tour.stars, 5)) }) : null
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-white/85", children: [
          tour.destination,
          " \xB7 ",
          formatDurationLabel(tour.duration, tour.duration_hours),
          tour.rating > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
            " \xB7 ",
            /* @__PURE__ */ jsx("span", { className: "text-coral", children: "\u2605" }),
            " ",
            tour.rating
          ] }) : null
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 px-2.5 py-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-faint", children: "\u0446\u0435\u043D\u0430 \u0437\u0430 \u0442\u0443\u0440" }),
        /* @__PURE__ */ jsxs("p", { className: "font-semibold text-coral", children: [
          "\u043E\u0442 ",
          formatPrice(tour.price, tour.currency)
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: hotelDetailsHrefFromTour(tour),
          className: "rounded-lg bg-coral px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-coral-deep",
          children: "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044E"
        }
      )
    ] }),
    tour.comment && /* @__PURE__ */ jsx("div", { className: "border-t border-line px-2.5 py-2", children: /* @__PURE__ */ jsxs("p", { className: "text-xs leading-snug text-ink/80", children: [
      "\u{1F4AC} ",
      tour.comment
    ] }) })
  ] });
}
function RoomCardView({
  room,
  hotelId,
  hotelImage
}) {
  const bookingHref = roomBookingHref(room, hotelId);
  const meals = Object.entries(room.meals).sort((a, b) => a[1] - b[1]);
  return /* @__PURE__ */ jsxs("div", { className: "flex gap-2.5 rounded-xl border border-line/60 bg-paper p-2.5", children: [
    hotelImage && /* @__PURE__ */ jsx(
      "img",
      {
        src: hotelImage,
        alt: "",
        loading: "lazy",
        className: "h-16 w-16 shrink-0 rounded-lg object-cover"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium leading-tight text-ink", children: room.room_type }),
      /* @__PURE__ */ jsx("div", { className: "mt-1.5 flex flex-wrap gap-1.5", children: meals.slice(0, 3).map(([meal, price]) => /* @__PURE__ */ jsxs(Badge, { className: "border-line bg-sand text-[10px] text-ink/80", children: [
        mealLabel(meal),
        " \xB7 \u043E\u0442 ",
        formatPrice(price, room.currency)
      ] }, meal)) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-coral", children: [
          "\u043E\u0442 ",
          formatPrice(room.min_price, room.currency)
        ] }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: bookingHref,
            className: "rounded-lg bg-coral px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-coral-deep",
            children: "\u041A \u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044E"
          }
        )
      ] })
    ] })
  ] });
}
function renderAssistantText(raw) {
  const cleaned = raw.replace(/^#{1,6}\s*/gm, "").replace(/^\s*[-*]\s+/gm, "\u2022 ");
  const parts = cleaned.split(/\*\*(.+?)\*\*/g);
  return parts.map(
    (part, i) => i % 2 === 1 ? /* @__PURE__ */ jsx("strong", { className: "font-semibold", children: part }, i) : part.replaceAll("**", "")
  );
}

// src/lib/constants.ts
typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL ?? "/api" : "/api";
var QUICK_ACTIONS = [
  {
    id: "ask",
    label: "Ask advice",
    labelRu: "\u0421\u043E\u0432\u0435\u0442 \u043A\u0443\u0434\u0430 \u0435\u0445\u0430\u0442\u044C",
    prompt: "\u041D\u0435 \u0437\u043D\u0430\u044E \u043A\u0443\u0434\u0430 \u043F\u043E\u0435\u0445\u0430\u0442\u044C \u0432 \u0441\u0435\u043D\u0442\u044F\u0431\u0440\u0435 \u0441 \u0440\u0435\u0431\u0451\u043D\u043A\u043E\u043C 5 \u043B\u0435\u0442 \u2014 \u0447\u0442\u043E \u043F\u043E\u0441\u043E\u0432\u0435\u0442\u0443\u0435\u0442\u0435?"
  },
  {
    id: "uai",
    label: "Ultra all inclusive",
    labelRu: "\u0427\u0442\u043E \u0442\u0430\u043A\u043E\u0435 \u0443\u043B\u044C\u0442\u0440\u0430 \u0432\u0441\u0451 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E",
    prompt: "\u0427\u0435\u043C \xAB\u0443\u043B\u044C\u0442\u0440\u0430 \u0432\u0441\u0451 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E\xBB \u043E\u0442\u043B\u0438\u0447\u0430\u0435\u0442\u0441\u044F \u043E\u0442 \xAB\u0432\u0441\u0451 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E\xBB? \u0427\u0442\u043E \u043B\u0443\u0447\u0448\u0435 \u0434\u043B\u044F \u0441\u0435\u043C\u044C\u0438 \u0441 \u0434\u0435\u0442\u044C\u043C\u0438?"
  },
  { id: "turkey", label: "Tours to Turkey", labelRu: "\u0422\u0443\u0440\u044B \u0432 \u0422\u0443\u0440\u0446\u0438\u044E", prompt: "\u041D\u0430\u0439\u0434\u0438 \u0442\u0443\u0440\u044B \u0432 \u0422\u0443\u0440\u0446\u0438\u044E" },
  { id: "egypt", label: "Tours to Egypt", labelRu: "\u0422\u0443\u0440\u044B \u0432 \u0415\u0433\u0438\u043F\u0435\u0442", prompt: "\u041D\u0430\u0439\u0434\u0438 \u0442\u0443\u0440\u044B \u0432 \u0415\u0433\u0438\u043F\u0435\u0442" }
];
function QuickActions({ onSelect }) {
  return /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: QUICK_ACTIONS.map((action) => /* @__PURE__ */ jsx(
    Button,
    {
      type: "button",
      variant: "outline",
      size: "sm",
      className: "h-8 border-line bg-sand/70 text-[11px] text-ink/80 hover:border-coral/50 hover:text-sea",
      onClick: () => onSelect(action.prompt),
      children: action.labelRu
    },
    action.id
  )) });
}
var Textarea = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "textarea",
  {
    ref,
    className: cn(
      "flex min-h-[44px] max-h-32 min-w-0 w-full flex-1 resize-none rounded-xl border border-line bg-paper/70 px-3 py-2.5 text-sm text-ink placeholder:text-faint outline-none transition focus:border-coral/60 focus:ring-2 focus:ring-coral/20",
      className
    ),
    ...props
  }
));
Textarea.displayName = "Textarea";
function ChatWidget({ fullscreenOnOpen = false }) {
  const { isOpen, isConnected, isTyping, messages, toggleOpen, send, newChat: newChat2, openChat } = useAssistant();
  const chats = useAssistantStore((s) => s.chats);
  const activeChatId = useAssistantStore((s) => s.activeChatId);
  const showChatList = useAssistantStore((s) => s.showChatList);
  const setShowChatList = useAssistantStore((s) => s.setShowChatList);
  const deleteChat = useAssistantStore((s) => s.deleteChat);
  const typingStatus = useAssistantStore((s) => s.typingStatus);
  const [draft, setDraft] = useState("");
  const [llmOn, setLlmOn] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);
  useEffect(() => {
    fetch(`${getApiBase()}/health`).then((r) => r.json()).then(
      (data) => setLlmOn(Boolean(data.llm?.enabled ?? data.kimi?.enabled))
    ).catch(() => setLlmOn(false));
  }, [isConnected]);
  useEffect(() => {
    const handler = (event) => {
      const detail = event.detail;
      if (detail) send(detail);
    };
    window.addEventListener("assistant:send", handler);
    return () => window.removeEventListener("assistant:send", handler);
  }, [send]);
  const submit = () => {
    if (!draft.trim() || isTyping) return;
    send(draft);
    setDraft("");
  };
  const panel = isOpen ? /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex flex-col overflow-hidden bg-paper animate-fade-in-up",
        fullscreenOnOpen ? "fixed inset-0 z-50 h-full w-full rounded-none border-0" : "h-[min(640px,calc(100vh-7rem))] w-[min(400px,calc(100vw-2rem))] rounded-[20px] border border-line shadow-pop"
      ),
      children: [
        /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between border-b border-line bg-paper px-4 py-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center gap-2.5", children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                "aria-hidden": true,
                className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral to-[#ffb35c] text-base shadow-[0_4px_12px_rgb(255_90_60_/_0.35)]",
                children: "\u2600\uFE0F"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "font-[family-name:var(--font-display)] text-[13px] font-semibold tracking-tight text-ink", children: "\u041C\u0438\u043B\u0430 \xB7 \u0422\u043E\u0442\u0443\u0441 \u043A\u043B\u0443\u0431" }),
              /* @__PURE__ */ jsx("p", { className: "mt-0.5 flex items-center gap-1.5 text-xs text-subtle", children: isConnected ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Wifi, { className: "h-3 w-3 text-ok" }),
                llmOn ? "\u041E\u043D\u043B\u0430\u0439\u043D \xB7 \u043F\u043E\u0434\u0431\u043E\u0440 \u0442\u0443\u0440\u043E\u0432" : "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(WifiOff, { className: "h-3 w-3 text-gold" }),
                " \u041F\u0435\u0440\u0435\u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u2026"
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon",
                className: "h-8 w-8",
                onClick: () => setShowChatList(!showChatList),
                title: "\u041C\u043E\u0438 \u0447\u0430\u0442\u044B",
                children: /* @__PURE__ */ jsx(MessagesSquare, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon",
                className: "h-8 w-8",
                onClick: newChat2,
                title: "\u041D\u043E\u0432\u044B\u0439 \u0447\u0430\u0442",
                children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon",
                className: "h-8 w-8",
                onClick: toggleOpen,
                "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0447\u0430\u0442",
                children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }),
        showChatList && /* @__PURE__ */ jsxs("div", { className: "max-h-64 overflow-y-auto border-b border-line bg-paper", children: [
          /* @__PURE__ */ jsx("p", { className: "px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-faint", children: "\u041C\u043E\u0438 \u0447\u0430\u0442\u044B" }),
          [...chats].reverse().map((chat) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: `group flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-sand ${chat.id === activeChatId ? "bg-sand/80 text-coral" : "text-ink/80"}`,
              children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => openChat(chat.id),
                    className: "min-w-0 flex-1 truncate text-left",
                    children: [
                      chat.title,
                      /* @__PURE__ */ jsx("span", { className: "ml-2 text-[10px] text-faint", children: new Date(chat.updatedAt).toLocaleDateString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit"
                      }) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => deleteChat(chat.id),
                    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0447\u0430\u0442",
                    className: "shrink-0 text-faint opacity-0 transition-opacity hover:text-gold group-hover:opacity-100",
                    children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                  }
                )
              ]
            },
            chat.id
          ))
        ] }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "flex-1 space-y-3 overflow-y-auto px-3 py-4",
              fullscreenOnOpen && "mx-auto w-full max-w-3xl px-4 sm:px-6"
            ),
            children: [
              messages.map((message) => /* @__PURE__ */ jsx(ChatMessage, { message }, message.id)),
              isTyping && /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-2xl rounded-bl-md border border-line bg-sand px-3 py-2.5", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "typing-dot h-1.5 w-1.5 rounded-full bg-coral" }),
                  /* @__PURE__ */ jsx("span", { className: "typing-dot h-1.5 w-1.5 rounded-full bg-coral" }),
                  /* @__PURE__ */ jsx("span", { className: "typing-dot h-1.5 w-1.5 rounded-full bg-coral" })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-subtle", children: [
                  typingStatus ?? "\u0414\u0443\u043C\u0430\u044E",
                  "\u2026"
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("div", { ref: bottomRef })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "space-y-2 border-t border-line p-3",
              fullscreenOnOpen && "mx-auto w-full max-w-3xl px-4 sm:px-6 sm:pb-5"
            ),
            children: [
              /* @__PURE__ */ jsx(
                QuickActions,
                {
                  onSelect: (prompt) => {
                    send(prompt);
                  }
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-2", children: [
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    ref: inputRef,
                    rows: 1,
                    value: draft,
                    placeholder: "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u0441\u043E\u0432\u0435\u0442 \u0438\u043B\u0438 \u043E\u043F\u0438\u0448\u0438\u0442\u0435 \u0442\u0443\u0440\u2026",
                    onChange: (e) => setDraft(e.target.value),
                    onKeyDown: (e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                      }
                    }
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    type: "button",
                    size: "icon",
                    className: "shrink-0 rounded-full",
                    onClick: submit,
                    disabled: !draft.trim() || isTyping,
                    "aria-label": "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
                    children: /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-center text-[10px] leading-snug text-faint", children: "\u0410\u0433\u0435\u043D\u0442 \u043C\u043E\u0436\u0435\u0442 \u043E\u0448\u0438\u0431\u0430\u0442\u044C\u0441\u044F \u2014 \u043F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u0435\u0440\u0435\u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0439\u0442\u0435 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0432\u0440\u0443\u0447\u043D\u0443\u044E." })
            ]
          }
        )
      ]
    }
  ) : null;
  const fab = /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: toggleOpen,
      className: "group flex h-14 w-14 items-center justify-center rounded-full border-0 bg-coral text-white shadow-[0_10px_28px_rgb(255_90_60_/_0.4)] transition hover:scale-105 hover:bg-coral-deep",
      "aria-label": isOpen ? "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0447\u0430\u0442" : "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0447\u0430\u0442",
      children: isOpen ? /* @__PURE__ */ jsx(X, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx(MessageCircle, { className: "h-6 w-6" })
    }
  );
  if (fullscreenOnOpen) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      panel,
      /* @__PURE__ */ jsx("div", { className: "fixed bottom-5 right-5 z-[60]", children: fab })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3", children: [
    panel,
    fab
  ] });
}

export { AiAssistantProvider, AiHomePage, AiTourDetailPage, ChatMessage, ChatWidget, QuickActions, SchemaVisualizer, TourCard, TourGrid, configureAiAssistant, getAiConfig, getApiBase, getTourHref, getWsUrl, useAssistant, useAssistantStore, useWebSocket };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map