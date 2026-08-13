import * as react from 'react';
import { ReactNode } from 'react';
import * as zustand from 'zustand';

type AiAssistantProviderProps = {
    children: ReactNode;
    /** e.g. https://apiv2.totus.club/api */
    apiBase?: string;
    /** e.g. wss://apiv2.totus.club/ws/assistant */
    wsUrl?: string;
    /** e.g. /tours or /ai/tours */
    tourBasePath?: string;
    /** e.g. / or /ai */
    homePath?: string;
    /**
     * `page` — полноценная AI-страница (фон + min-height).
     * `widget` — только плавающий чат на сайте-хосте (без влияния на layout).
     */
    shell?: 'page' | 'widget';
};
declare function AiAssistantProvider({ children, apiBase, wsUrl, tourBasePath, homePath, shell, }: AiAssistantProviderProps): react.JSX.Element;

type AiAssistantConfig = {
    /** HTTP API prefix, e.g. https://apiv2.totus.club/api or /api */
    apiBase: string;
    /** WebSocket URL, e.g. wss://apiv2.totus.club/ws/assistant */
    wsUrl?: string;
    /** Base path for tour detail links, default /tours */
    tourBasePath: string;
    /** Home link for «Все туры», default / */
    homePath: string;
};
declare function configureAiAssistant(partial: Partial<AiAssistantConfig>): void;
declare function getAiConfig(): AiAssistantConfig;
declare function getApiBase(): string;
declare function getTourHref(tourId: string, room?: string): string;
declare function getWsUrl(): string;

declare function AiHomePage({ autoOpenChat }: {
    autoOpenChat?: boolean;
}): react.JSX.Element;

declare function AiTourDetailPage({ tourId, selectedRoom, }: {
    tourId: string;
    selectedRoom?: string | null;
}): react.JSX.Element;

type ChatWidgetProps = {
    /**
     * Если true — кнопка справа внизу открывает чат на весь экран (модалка).
     * По умолчанию false — маленький виджет (как на ai.totus.club).
     */
    fullscreenOnOpen?: boolean;
};
declare function ChatWidget({ fullscreenOnOpen }: ChatWidgetProps): react.JSX.Element;

type TourCategory = 'adventure' | 'cultural' | 'food' | 'relaxation' | 'nightlife' | 'family';
type DurationFilter = 'half-day' | 'full-day' | 'multi-day';
interface ItineraryItem {
    time: string;
    title: string;
    description: string;
}
interface Location {
    address: string;
    lat: number;
    lng: number;
}
interface Review {
    id: string;
    author: string;
    rating: number;
    comment: string;
    date: string;
}
interface Tour {
    pick_label?: string;
    comment?: string;
    id: string;
    name: string;
    destination: string;
    description: string;
    price: number;
    currency: string;
    duration: string;
    /** Client hotel-details URL (totus / kedam), when provided by the API */
    link?: string;
    duration_hours: number;
    max_group_size: number;
    rating: number;
    review_count: number;
    stars?: number;
    category: TourCategory;
    images: string[];
    emoji: string;
    itinerary: ItineraryItem[];
    inclusions: string[];
    exclusions: string[];
    meeting_point: Location;
    cancellation_policy: string;
    guide_languages: string[];
    available_dates: string[];
    reviews: Review[];
}
interface BookingRequest {
    tour_id: string;
    date: string;
    guests: number;
    contact_email: string;
    contact_phone: string;
    guest_names: string[];
    special_requests?: string;
}
interface BookingResponse {
    booking_id: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    total_price: number;
    created_at: string;
    tour_name?: string;
    date?: string;
    guests?: number;
}
interface ChatMessage$1 {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: {
        tool_calls?: ToolCall[];
        tour_results?: Tour[];
        booking?: BookingResponse;
        destination_cards?: DestinationCard[];
        room_cards?: RoomCardsPayload;
    };
}
interface ToolCall {
    id?: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
    status?: 'running' | 'done' | 'error';
    label?: string;
    summary?: string;
    api_calls?: string[];
}
interface SearchFilters {
    fromCity: string;
    destination: string;
    nights: number;
    adults: number;
    kids: number;
    startDate: string;
    starsFrom: number;
    starsTo: number;
    priceMin: number;
    priceMax: number;
    sortBy: 'price' | 'rating' | 'stars';
    /** @deprecated kept for compatibility */
    category?: TourCategory | 'all';
    duration?: DurationFilter | 'all';
    dateFrom?: string;
    dateTo?: string;
}
interface AvailabilityResponse {
    tour_id: string;
    date: string;
    available: boolean;
    spots_left: number;
    price: number;
}
interface SchemaColumn {
    name: string;
    type: string;
    pk?: boolean;
    fk?: string;
    nullable?: boolean;
}
interface SchemaTable {
    name: string;
    columns: SchemaColumn[];
}
interface RoomCard {
    room_type: string;
    min_price: number;
    currency: string;
    meals: Record<string, number>;
    offers_count: number;
    sample_tour_id?: string;
    url?: string;
    booking_url?: string;
}
interface RoomCardsPayload {
    hotel: {
        id: number;
        name?: string;
        image?: string;
    };
    rooms: RoomCard[];
}
interface DestinationCard {
    name: string;
    country?: string;
    tagline?: string;
    image?: string;
    emoji?: string;
}
interface WsServerMessage {
    type: 'token' | 'done' | 'error' | 'tool' | 'tours' | 'booking' | 'typing' | 'destinations' | 'rooms';
    content?: string;
    messageId?: string;
    tool?: ToolCall;
    tours?: Tour[];
    booking?: BookingResponse;
    destinations?: DestinationCard[];
    rooms?: RoomCard[];
    hotel?: {
        id: number;
        name?: string;
        image?: string;
    };
    error?: string;
}
interface WsClientMessage {
    type: 'chat' | 'reset';
    content?: string;
    sessionId?: string;
}

declare function ChatMessage({ message }: {
    message: ChatMessage$1;
}): react.JSX.Element | null;

declare function TourGrid({ tours, isLoading, }: {
    tours?: Tour[];
    isLoading: boolean;
}): react.JSX.Element;

declare function TourCard({ tour }: {
    tour: Tour;
}): react.JSX.Element;

declare function QuickActions({ onSelect }: {
    onSelect: (prompt: string) => void;
}): react.JSX.Element;

declare function SchemaVisualizer({ open, onClose, }: {
    open: boolean;
    onClose: () => void;
}): react.JSX.Element | null;

declare function useAssistant(): {
    isOpen: boolean;
    isConnected: boolean;
    isTyping: boolean;
    messages: ChatMessage$1[];
    toggleOpen: () => void;
    setOpen: (open: boolean) => void;
    send: (content: string) => void;
    reset: () => void;
    newChat: () => void;
    openChat: (id: string) => void;
};

declare function useWebSocket(enabled?: boolean): {
    send: (content: string) => void;
    reset: () => void;
    newChat: () => void;
    openChat: (id: string) => void;
    streamingId: string | null;
};

interface AssistantState {
    isOpen: boolean;
    isConnected: boolean;
    isTyping: boolean;
    typingStatus: string | null;
    messages: ChatMessage$1[];
    chats: ChatSession[];
    activeChatId: string;
    showChatList: boolean;
    streamingId: string | null;
    highlightedTours: Tour[];
    showSchema: boolean;
    toggleOpen: () => void;
    setOpen: (open: boolean) => void;
    setConnected: (connected: boolean) => void;
    setTyping: (typing: boolean) => void;
    setTypingStatus: (status: string | null) => void;
    setShowSchema: (show: boolean) => void;
    addMessage: (message: Omit<ChatMessage$1, 'id' | 'timestamp'> & {
        id?: string;
    }) => string;
    appendToMessage: (id: string, chunk: string) => void;
    updateMessage: (id: string, patch: Partial<ChatMessage$1>) => void;
    setStreamingId: (id: string | null) => void;
    setHighlightedTours: (tours: Tour[]) => void;
    clearMessages: () => void;
    setShowChatList: (show: boolean) => void;
    startNewChat: () => void;
    switchChat: (id: string) => ChatMessage$1[];
    deleteChat: (id: string) => void;
}
interface ChatSession {
    id: string;
    title: string;
    updatedAt: number;
    messages: ChatMessage$1[];
}
declare const useAssistantStore: zustand.UseBoundStore<zustand.StoreApi<AssistantState>>;

export { type AiAssistantConfig, AiAssistantProvider, type AiAssistantProviderProps, AiHomePage, AiTourDetailPage, type AvailabilityResponse, type BookingRequest, type BookingResponse, ChatMessage, ChatWidget, type ChatWidgetProps, type DestinationCard, type DurationFilter, type ItineraryItem, type Location, QuickActions, type Review, type RoomCard, type RoomCardsPayload, type SchemaColumn, type SchemaTable, SchemaVisualizer, type SearchFilters, type ToolCall, type Tour, TourCard, type TourCategory, TourGrid, type WsClientMessage, type WsServerMessage, configureAiAssistant, getAiConfig, getApiBase, getTourHref, getWsUrl, useAssistant, useAssistantStore, useWebSocket };
