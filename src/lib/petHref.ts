export function petHref(pet: { id: string; username?: string | null }): `/pet/${string}` {
  const slug = pet.username?.replace(/^@/, '').trim();
  return `/pet/${slug || pet.id}`;
}
