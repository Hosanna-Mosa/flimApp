/**
 * Resolve the avatar image URL to render.
 *
 * Returns the given remote URL when present; otherwise the app-wide shared
 * default avatar image (no per-user colour is applied).
 */
export function getAvatarUrl(avatar?: string | null): string {
  if (avatar && avatar.trim() !== '') {
    return avatar;
  }

  return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
}
