export function getItems<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function setItems<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
}

export function addItem<T>(key: string, item: T): void {
  const items = getItems<T>(key);
  items.unshift(item);
  setItems(key, items);
}

export function removeItem<T extends { id: string }>(
  key: string,
  id: string
): void {
  const items = getItems<T>(key);
  setItems(
    key,
    items.filter((item) => item.id !== id)
  );
}

export function getObject<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setObject<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}
