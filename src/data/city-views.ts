export type CityView = {
  slug: string;
  city: string;
  title: string;
  category: string;
  images?: string[];
  embedUrl?: string;
  linkUrl?: string;
};

export const CITY_VIEWS: CityView[] = [
  {
    slug: "tripoli",
    city: "Tripoli",
    title: "Martyrs' Square",
    category: "Landmark",
    embedUrl: "https://www.google.com/maps?q=Martyrs+Square+Tripoli+Libya&output=embed",
    linkUrl: "https://www.google.com/maps/search/?api=1&query=Martyrs+Square+Tripoli+Libya",
  },
  {
    slug: "benghazi",
    city: "Benghazi",
    title: "Benghazi Corniche",
    category: "Waterfront",
    embedUrl: "https://www.google.com/maps?q=Benghazi+Corniche&output=embed",
    linkUrl: "https://www.google.com/maps/search/?api=1&query=Benghazi+Corniche",
  },
  {
    slug: "misrata",
    city: "Misrata",
    title: "City Center",
    category: "Downtown",
    embedUrl: "https://www.google.com/maps?q=Misrata+City+Center&output=embed",
    linkUrl: "https://www.google.com/maps/search/?api=1&query=Misrata+City+Center",
  },
  {
    slug: "derna",
    city: "Derna",
    title: "Derna Coast",
    category: "Scenic",
    embedUrl: "https://www.google.com/maps?q=Derna+Libya&output=embed",
    linkUrl: "https://www.google.com/maps/place/Derna,+Libya",
  },
  {
    slug: "gharyan",
    city: "Gharyan",
    title: "Gharyan Viewpoint",
    category: "Hilltop",
    embedUrl: "https://www.google.com/maps?q=Gharyan+Libya&output=embed",
    linkUrl: "https://www.google.com/maps/search/?api=1&query=Gharyan+Libya",
  },
  {
    slug: "sirte",
    city: "Sirte",
    title: "Sirte Waterfront",
    category: "Waterfront",
    embedUrl: "https://www.google.com/maps?q=Sirte+Libya+Waterfront&output=embed",
    linkUrl: "https://www.google.com/maps/search/?api=1&query=Sirte+Libya+Waterfront",
  },
];
