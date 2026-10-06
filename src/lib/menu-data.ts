import { API_URL } from './api';

export interface MenuItem {
  id: string;
  screen: number;
  section: string;
  sectionOrder: number;
  name: string;
  description: string;
  hotIced: string;
  price: number | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface MenuSection {
  name: string;
  items: MenuItem[];
}

interface ApiMenuRow {
  id: string;
  screen: number;
  section: string;
  section_order: number;
  name: string;
  description?: string | null;
  hot_iced?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  sort_order: number;
}

function mapRow(row: ApiMenuRow): MenuItem {
  return {
    id: row.id,
    screen: row.screen,
    section: row.section,
    sectionOrder: row.section_order,
    name: row.name,
    description: row.description ?? '',
    hotIced: row.hot_iced ?? '',
    price: row.price === null || row.price === undefined || row.price === '' ? null : Number(row.price),
    imageUrl: row.image_url ?? null,
    sortOrder: row.sort_order,
  };
}

/** Pulls the live menu from the API. Returns [] on any failure so the board renders empty rather than crashing. */
export async function fetchMenu(): Promise<MenuItem[]> {
  try {
    const res = await fetch(`${API_URL}/menu-items`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapRow) : [];
  } catch {
    return [];
  }
}

/** Groups items for one screen into their sections, preserving the API's sort order. */
export function groupByScreen(items: MenuItem[], screen: number): MenuSection[] {
  const sections: MenuSection[] = [];
  const indexByName = new Map<string, number>();

  for (const item of items) {
    if (item.screen !== screen) continue;
    let index = indexByName.get(item.section);
    if (index === undefined) {
      index = sections.length;
      indexByName.set(item.section, index);
      sections.push({ name: item.section, items: [] });
    }
    sections[index].items.push(item);
  }

  return sections;
}

export function formatPrice(price: number | null): string {
  return price === null ? '—' : `$${price.toFixed(2)}`;
}
