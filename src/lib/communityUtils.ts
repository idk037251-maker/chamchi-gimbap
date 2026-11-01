import { Community } from "@/types/chat";

/**
 * Strict deduplication for communities.
 * Ensures that no two communities have:
 * 1) The same ID (case-sensitive or trimmed)
 * 2) The same normalized Name (case-insensitive, trimmed)
 *
 * If duplicate names exist, preserves the one with more members/channels or the latest created.
 */
export function deduplicateCommunities(list: Community[]): Community[] {
  if (!Array.isArray(list)) return [];

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const result: Community[] = [];

  for (const item of list) {
    if (!item || !item.id) continue;

    const trimmedId = item.id.trim();
    const normalizedName = (item.name || "").trim().toLowerCase();

    if (seenIds.has(trimmedId)) {
      continue;
    }
    if (normalizedName && seenNames.has(normalizedName)) {
      continue;
    }

    seenIds.add(trimmedId);
    if (normalizedName) {
      seenNames.add(normalizedName);
    }

    result.push({
      ...item,
      rules: Array.isArray(item.rules) ? item.rules : [],
      tags: Array.isArray(item.tags) ? item.tags : [],
      channels: Array.isArray(item.channels) ? item.channels : [],
      members: Array.isArray(item.members) ? item.members : [],
      kickedUserIds: Array.isArray(item.kickedUserIds) ? item.kickedUserIds : [],
    });
  }

  return result;
}
