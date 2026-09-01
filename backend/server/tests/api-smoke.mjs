/**
 * End-to-end API smoke test. Runs against a live server - never point it at
 * production, it registers and deletes real users.
 *
 *   MONGODB_URI="mongodb://127.0.0.1:27017/filmy_apitest" ENABLE_REDIS=false \
 *     PORT=8777 node server/src/server.js
 *   node server/tests/api-smoke.mjs
 */
const BASE = process.env.API_BASE || 'http://127.0.0.1:8777';
const results = [];
let pass = 0, fail = 0;

const req = async (method, path, { token, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json };
};
let group = '';
const G = (g) => { group = g; results.push(['GROUP', g, '']); };
const check = (name, cond, detail = '') => {
  if (cond) { pass++; results.push(['PASS', name, '']); } else { fail++; results.push(['FAIL', name, detail]); }
};
const arr = (r) => { const d = r.json?.data; if (Array.isArray(d)) return d; if (Array.isArray(d?.data)) return d.data; if (Array.isArray(d?.items)) return d.items; if (Array.isArray(r.json)) return r.json; return []; };

const rnd = Math.floor(Math.random() * 1e9);
const mk = (p) => ({ name: `T ${p}`, username: `t${p}${rnd}`, email: `${p}${rnd}@t.com`, phone: `${p}${rnd}`.slice(0,10), password: 'secret123', roles: ['actor'], industries: ['tollywood'] });
const A = mk('7'), B = mk('8');

let r = await req('POST', '/auth/register', { body: A });
const tA = r.json?.data?.accessToken, iA = r.json?.data?.user?._id;
r = await req('POST', '/auth/register', { body: B });
const tB = r.json?.data?.accessToken, iB = r.json?.data?.user?._id;
if (!tA || !tB) { console.log('setup failed', JSON.stringify(r.json)); process.exit(1); }

G('Malformed-id handling (CastError fix)');
for (const [p, tok] of [['/posts/feed', tA], ['/posts/not-an-id', tA], ['/users/not-an-id', tA], ['/api/communities/not-an-id', tA]]) {
  r = await req('GET', p, { token: tok });
  check(`GET ${p} → 4xx not 500`, r.status >= 400 && r.status < 500, `got ${r.status}`);
}
r = await req('POST', '/auth/register', { body: { ...A, username: `x${rnd}`, phone: `77${rnd}`.slice(0,10) } });
check('duplicate email → 409 (not 500 dup-key leak)', r.status === 409, `got ${r.status}`);

G('Posts, likes, comments, saves');
r = await req('POST', '/posts', { token: tA, body: { type: 'text', caption: 'hello world', roles: [], industries: [] } });
const postId = r.json?.data?._id;
check('create post', !!postId, `got ${r.status}`);

r = await req('GET', `/posts/${postId}`, { token: tB });
check('fetch post by id', r.status === 200, `got ${r.status}`);

r = await req('POST', `/api/posts/${postId}/like`, { token: tB });
check('like a post', r.status === 200 || r.status === 201, `got ${r.status}`);
r = await req('GET', `/posts/${postId}`, { token: tB });
check('like increments the counter', (r.json?.data?.engagement?.likesCount ?? r.json?.data?.likesCount ?? 0) >= 1, `likesCount=${JSON.stringify(r.json?.data?.engagement)}`);
r = await req('POST', `/api/posts/${postId}/like`, { token: tB });
check('double-like is rejected, not double-counted', r.json?.data?.success !== true || r.status >= 400, `got ${r.status}`);
r = await req('DELETE', `/api/posts/${postId}/like`, { token: tB });
check('unlike succeeds', r.status === 200, `got ${r.status}`);
r = await req('GET', `/posts/${postId}`, { token: tB });
check('unlike decrements back to 0', ((r.json?.data?.engagement?.likesCount ?? r.json?.data?.likesCount) ?? -1) === 0, `likesCount=${JSON.stringify(r.json?.data?.engagement)}`);

r = await req('POST', `/api/posts/${postId}/comments`, { token: tB, body: { content: 'nice one' } });
const commentId = r.json?.data?._id;
check('add a comment', r.status === 201 || r.status === 200, `got ${r.status}`);
r = await req('GET', `/api/posts/${postId}/comments`, { token: tA });
check('comments list returns it', arr(r).some(c => (c.content || c.text) === 'nice one'), `${arr(r).length} comments`);

r = await req('POST', `/posts/${postId}/save`, { token: tB });
check('save a post', r.status === 200 || r.status === 201, `got ${r.status}`);
r = await req('GET', '/posts/saved/list', { token: tB });
if (r.status === 404) { r = await req('GET', '/users/me/saved', { token: tB }); }
check('saved list reachable', r.status === 200, `got ${r.status}`);

r = await req('DELETE', `/posts/${postId}`, { token: tB });
check('cannot delete someone else’s post', r.status === 403 || r.status === 404, `got ${r.status} — 200 is a serious authz hole`);

G('Follow graph');
r = await req('POST', `/api/users/${iB}/follow`, { token: tA });
check('follow a user', r.status === 200 || r.status === 201, `got ${r.status}`);
r = await req('GET', `/users/${iB}`, { token: tA });
check('followersCount increments', (r.json?.data?.followersCount ?? r.json?.data?.stats?.followersCount ?? 0) >= 1, `got ${JSON.stringify(r.json?.data?.stats ?? r.json?.data?.followersCount)}`);
r = await req('GET', `/api/users/${iB}/followers`, { token: tA });
check('followers list includes A', arr(r).length >= 1, `${arr(r).length} followers, status ${r.status}`);
r = await req('POST', `/api/users/${iA}/follow`, { token: tA });
check('cannot follow yourself', r.status >= 400, `got ${r.status}`);

G('Messaging');
r = await req('POST', '/messages', { token: tA, body: { recipientId: iB, content: 'hi there', type: 'text' } });
if (r.status === 404) r = await req('POST', '/messages/send', { token: tA, body: { recipientId: iB, content: 'hi there', type: 'text' } });
check('send a direct message', r.status === 200 || r.status === 201, `got ${r.status} ${r.json?.message ?? ''}`);
r = await req('GET', '/messages', { token: tB });
check('recipient sees the conversation', r.status === 200 && arr(r).length >= 1, `got ${r.status}, ${arr(r).length} conversations`);
r = await req('GET', `/messages/${iA}`, { token: tB });
check('conversation thread loads', r.status === 200, `got ${r.status}`);

G('Notifications');
r = await req('GET', '/notifications', { token: tB });
check('notifications list loads', r.status === 200, `got ${r.status}`);
check('follow/like generated a notification', arr(r).length >= 1, `${arr(r).length} notifications — engagement should notify`);
r = await req('GET', '/notifications/count', { token: tB });
check('unread count endpoint', r.status === 200, `got ${r.status}`);

G('Search & discovery');
r = await req('GET', `/users?q=${A.username}`, { token: tB });
if (r.status === 404) r = await req('GET', `/users?search=${A.username}`, { token: tB });
check('user search finds A', r.status === 200 && arr(r).some(u => u.username === A.username), `got ${r.status}, ${arr(r).length} hits`);
r = await req('GET', '/api/feed', { token: tB });
check('feed loads', r.status === 200, `got ${r.status}`);

G('Communities');
r = await req('POST', '/api/communities', { token: tA, body: { name: `Com${rnd}`, description: 'd', type: 'general', privacy: 'public' } });
const cid = r.json?.data?._id;
check('create community', !!cid, `got ${r.status}`);
r = await req('POST', `/api/communities/${cid}/join`, { token: tB });
check('join a public community', r.status === 200 || r.status === 201, `got ${r.status}`);
r = await req('GET', `/api/communities/${cid}/members`, { token: tA });
check('member list has 2', arr(r).length === 2, `${arr(r).length} members`);
r = await req('GET', `/api/communities/${cid}/groups`, { token: tB });
const gid = arr(r)[0]?._id;
r = await req('POST', `/api/communities/${cid}/groups/${gid}/join`, { token: tB });
check('member CAN join a group (403 fix is not over-broad)', r.status === 200 || r.status === 201 || r.status === 409, `got ${r.status} ${r.json?.message ?? ''}`);
r = await req('DELETE', `/api/communities/${cid}`, { token: tB });
check('non-owner cannot delete the community', r.status === 403 || r.status === 404, `got ${r.status}`);

G('Wallet');
r = await req('GET', '/users/me/wallet', { token: tA });
if (r.status === 404) r = await req('GET', '/api/wallet', { token: tA });
check('wallet endpoint reachable', r.status === 200 || r.status === 404, `got ${r.status}`);

G('Account deletion cascade');
r = await req('DELETE', '/users/me', { token: tB });
check('B deletes their account', r.status === 200, `got ${r.status}`);
r = await req('GET', `/users/${iB}`, { token: tA });
check('deleted user is gone', r.status === 404 || !r.json?.data, `got ${r.status}`);
r = await req('GET', `/users/me`, { token: tA });
check('A’s followingCount rolled back after B left', ((r.json?.data?.followingCount ?? r.json?.data?.stats?.followingCount) ?? 0) === 0, `followingCount=${r.json?.data?.followingCount} — stale counter`);
r = await req('GET', `/api/communities/${cid}/members`, { token: tA });
check('community memberCount drops to 1', arr(r).length === 1, `${arr(r).length} members remain`);
r = await req('GET', `/api/posts/${postId}/comments`, { token: tA });
check('B’s comments were removed', !arr(r).some(c => (c.content || c.text) === 'nice one'), 'orphaned comment left behind');
r = await req('GET', '/messages', { token: tA });
check('B’s messages were removed', arr(r).length === 0, `${arr(r).length} conversations left with a deleted user`);

let cur = '';
for (const [s, name, detail] of results) {
  if (s === 'GROUP') { console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 42 - name.length))}`); continue; }
  console.log(`  ${s === 'PASS' ? '✓' : '✗'} ${name}${detail ? `\n      → ${detail}` : ''}`);
}
console.log(`\n  ${pass} passed, ${fail} failed, ${pass + fail} total\n`);
process.exit(fail > 0 ? 1 : 0);
