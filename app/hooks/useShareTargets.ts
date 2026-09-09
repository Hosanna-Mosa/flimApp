import { useEffect, useMemo, useState } from 'react';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { Community, CommunityRole } from '@/types';

export interface ShareTarget {
  /** Unique across all three lists, for React keys. */
  key: string;
  kind: 'chat' | 'person' | 'group';
  /** User id for a chat or a person; group id for a group. */
  id: string;
  name: string;
  avatar?: string;
  subtitle?: string;
  isBadgeVerified?: boolean;
  /** Groups only: the community the group belongs to. */
  communityId?: string;
}

const canPostTo = (role: CommunityRole | undefined) => role === 'admin' || role === 'owner';

/**
 * Everywhere shared content can be sent: existing conversations, people found
 * by search, and the groups of the communities the user belongs to.
 *
 * One search box drives all three — the conversation list server-side (through
 * useConversations, the same loader the Messages screen uses), people through
 * the people search the Search tab uses, and groups client-side, since they are
 * already loaded in full.
 */
export function useShareTargets() {
  const { token, user, blockedUsers } = useAuth();
  const [query, setQuery] = useState('');

  const conversations = useConversations();
  const [people, setPeople] = useState<ShareTarget[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [groups, setGroups] = useState<ShareTarget[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const { setSearchQuery } = conversations;
  useEffect(() => {
    setSearchQuery(query);
  }, [query, setSearchQuery]);

  // ---- Groups. One request: /communities/my returns each community with its
  // groups embedded, so there is nothing to fetch per community.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const res: any = await api.myCommunities(0, 50, token);
        const communities: Community[] = res?.data || [];

        const flattened = communities.flatMap((community) =>
          (community.groups || [])
            // An announcement-only group takes posts from admins alone. Listing
            // it for everyone else offers a share the server will refuse.
            .filter((group) => !group.isAnnouncementOnly || canPostTo(community.memberRole))
            .map<ShareTarget>((group) => ({
              key: `group:${community._id}:${group._id}`,
              kind: 'group',
              id: group._id,
              communityId: community._id,
              name: group.name,
              subtitle: community.name,
              avatar: community.avatar,
            }))
        );

        if (!cancelled) setGroups(flattened);
      } catch (err) {
        console.error('[share] Could not load groups:', err);
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // ---- People. Only searched for, never listed by default: without a query
  // this would be every user on the platform, which is not a share target list.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setPeople([]);
      setSearchingPeople(false);
      return;
    }

    setSearchingPeople(true);
    const timer = setTimeout(async () => {
      try {
        const res: any = await api.searchUsers({ q }, token || undefined);
        const found: any[] = res?.data || (Array.isArray(res) ? res : []);
        const myId = user?.id || (user as any)?._id;

        setPeople(
          found
            .map((u) => ({ ...u, id: u.id || u._id }))
            .filter((u) => u.id !== myId && !blockedUsers.includes(u.id))
            .map<ShareTarget>((u) => ({
              key: `person:${u.id}`,
              kind: 'person',
              id: u.id,
              name: u.name,
              avatar: u.avatar,
              subtitle: Array.isArray(u.roles) && u.roles.length ? u.roles.join(', ') : undefined,
              isBadgeVerified: u.isBadgeVerified,
            }))
        );
      } catch (err) {
        console.error('[share] People search failed:', err);
        setPeople([]);
      } finally {
        setSearchingPeople(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, token, user, blockedUsers]);

  const chats = useMemo<ShareTarget[]>(
    () =>
      conversations.chats.map((c) => ({
        key: `chat:${c.user.id}`,
        kind: 'chat',
        id: c.user.id,
        name: c.user.name,
        avatar: c.user.avatar,
        subtitle: c.lastMessage || 'No messages yet',
        isBadgeVerified: c.user.isBadgeVerified,
      })),
    [conversations.chats]
  );

  // Someone already in the conversation list is listed there, with their last
  // message; showing them again under People is the same target twice.
  const chatIds = useMemo(() => new Set(chats.map((c) => c.id)), [chats]);
  const otherPeople = useMemo(
    () => people.filter((p) => !chatIds.has(p.id)),
    [people, chatIds]
  );

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) || (g.subtitle ?? '').toLowerCase().includes(q)
    );
  }, [groups, query]);

  return {
    query,
    setQuery,
    chats,
    people: otherPeople,
    groups: visibleGroups,
    loadingChats: conversations.loading,
    loadingGroups,
    searchingPeople,
    isEmpty:
      !conversations.loading &&
      !loadingGroups &&
      !searchingPeople &&
      chats.length === 0 &&
      otherPeople.length === 0 &&
      visibleGroups.length === 0,
  };
}
