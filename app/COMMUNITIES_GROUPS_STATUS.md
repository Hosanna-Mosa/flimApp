# Communities Groups & Discovery Implementation status

## Completed Features

### 1. Group Management
- **Create Group** (`app/app/communities/[id]/create-group.tsx`):
  - Admins can create new groups (Discussion or Announcement-only).
  - Accessed via FAB in the "Groups" tab of Community Detail.
- **Delete Group** (`app/app/communities/[id]/groups/[groupId].tsx`):
  - Admins can delete a group via the header "More" menu.
  - Implemented `api.deleteGroup` in API client.
- **Create Post in Group**:
  - Added FAB in Group Feed to quickly create a post in the current group.
  - Updated `create-post.tsx` to handle authentication tokens.

### 2. Discovery & Search
- **Search Bar** (`app/app/communities/index.tsx`):
  - Added real-time search filtering in the "Discover" tab.
  - Updates list using `api.communities({ search: query })`.

### 3. API & Authentication enhancements
- **Token Injection**: All community-related screens (`index`, `[id]`, `create-post`, `create-group`, `[groupId]`, `settings`, `members`) now correctly pass authentication tokens to the API.
- **New Endpoints**: Added `api.updateGroup` and `api.deleteGroup` to `app/utils/api.ts`.

## Next Steps
- **Push Notifications**: Integrate with backend notification service for new posts/invites.
- **Deep Linking**: Ensure links to `/communities/[id]` work from outside the app.
- **Polish**: Add "Typing..." indicators or "Online" status if desired.
