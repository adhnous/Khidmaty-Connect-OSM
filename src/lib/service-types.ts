export type ServicePriceMode = 'firm' | 'negotiable' | 'call' | 'hidden';

export type ServiceStatus = 'pending' | 'approved' | 'rejected';

export type ServiceImage = {
  url: string;
  hint?: string;
  publicId?: string; // Cloudinary public_id if available
};

export type SubService = {
  id: string;
  title: string;
  price: number;
  unit?: string;
  description?: string;
};

export type Service = {
  id?: string;
  title: string;
  description: string;
  price: number;
  priceMode?: ServicePriceMode;
  showPriceInContact?: boolean;
  // Whether seekers can send in-app requests to this service
  acceptRequests?: boolean;
  category: string;
  city: string;
  area: string;
  availabilityNote?: string;
  images: ServiceImage[];
  contactPhone?: string;
  contactWhatsapp?: string;
  videoUrl?: string;
  // New: multiple YouTube links (preferred) and social links
  videoUrls?: string[];
  facebookUrl?: string;
  telegramUrl?: string;
  // Optional map URL to external maps (Google Maps/OSM)
  mapUrl?: string;
  providerId: string;
  providerName?: string | null;
  providerEmail?: string | null;
  subservices?: SubService[];
  status?: ServiceStatus;
  // Optional geolocation for map; when absent, UI falls back to city centroid
  lat?: number;
  lng?: number;
  // Boosting / promotion flags
  featured?: boolean; // manually featured
  priority?: number; // 0..N, higher floats to top client-side
  // Simple share metric (owner-incremented client-side)
  shareCount?: number; // total times owner pressed Share
  // Simple view metric (incremented server-side when available)
  viewCount?: number; // total views
  // Service deletion request state (server-maintained)
  pendingDelete?: boolean;
  createdAt?: unknown;
};

