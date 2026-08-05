export interface Service {
  id: string;
  businessId: string;
  name: string;
  durationMinutes: number;
  price: number;
  category?: string;
  color?: string;
}

export interface ServiceGroup {
  category: string;
  services: Service[];
}

export function groupServicesByCategory(services: Service[]): ServiceGroup[] {
  const hasCategories = services.some((s) => !!s.category?.trim());
  if (!hasCategories) {
    return services.length > 0 ? [{ category: '', services }] : [];
  }
  const order: string[] = [];
  const groups = new Map<string, Service[]>();
  for (const service of services) {
    const key = service.category?.trim() || 'Other';
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(service);
  }
  return order.map((category) => ({ category, services: groups.get(category)! }));
}
