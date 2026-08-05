export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt?: Date;
}

export function getClientDisplayName(client: Pick<Client, 'firstName' | 'lastName'>): string {
  return [client.firstName, client.lastName].filter(Boolean).join(' ').trim();
}

export function filterClients(clients: Client[], search: string): Client[] {
  const q = search.trim().toLowerCase();
  if (!q) return clients;
  return clients.filter(
    (c) => getClientDisplayName(c).toLowerCase().includes(q) || c.phone.toLowerCase().includes(q),
  );
}
