# manage-teams/[teamId]/page.tsx — useEffect explanations

This document explains each useEffect in `app/admin/manage-teams/[teamId]/page.tsx`. For each effect you will find the original code snippet followed by a detailed explanation of the logic, dependencies, mounted/unmounted handling, and potential pitfalls.

---

## 1) Fetch available users when Add dialog opens

Code:

```tsx
React.useEffect(() => {
  if (!showAddDialog || !accessToken || !teamId) return;
  let mounted = true;
  (async () => {
    setLoadingAvailable(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Failed to fetch users for add dropdown", json);
        return;
      }

      const users = (json.users ?? []) as Array<any>;
      const memberIds = new Set(datas.map((d) => String(d.id)));
      const notMembers = users
        .filter((u) => !memberIds.has(String(u.id)))
        .map((u) => ({
          id: String(u.id),
          email: u.email ?? "",
          fullName: u.fullName ?? "",
          role: u.role,
        }))
        .sort((a, b) => (a.email || "").localeCompare(b.email || ""));

      if (mounted) {
        setAvailableUsers(notMembers);
        setSelectedUserId(notMembers.length > 0 ? notMembers[0].id : null);
      }
    } catch (err) {
      console.error("Error fetching available users", err);
    } finally {
      if (mounted) setLoadingAvailable(false);
    }
  })();
  return () => {
    mounted = false;
  };
}, [showAddDialog, accessToken, teamId, datas]);
```

Explanation:

- Purpose: When the Add User dialog opens (`showAddDialog === true`), this effect fetches all users from `/api/admin/users` and computes the subset that are not current members of the team. It populates `availableUsers` and sets an initial `selectedUserId`.

- Guard clauses: The effect returns early if the dialog is closed or if required context (access token or team id) is missing. This avoids unnecessary network traffic.

- Mounted guard: A local `mounted` boolean is used so async callbacks avoid calling state setters after the component has unmounted or after the effect has been cleaned up. The cleanup function flips `mounted = false`. All state updates are wrapped in `if (mounted) { ... }`.

- Why mounted guard is used: Because the effect runs an async fetch. If the component unmounts (e.g., user navigates away or dialog closes quickly), the fetch may still resolve. Without the guard React would warn about "setState on an unmounted component" or the state update could apply to a stale component tree.

- Dependencies: `[showAddDialog, accessToken, teamId, datas]` means the effect runs whenever the dialog is opened/closed, the token changes, the teamId changes, or `datas` (current team members) is modified. `datas` is necessary to compute which users are not members.

- Potential pitfalls and suggestions:
  - Race conditions: if `showAddDialog` toggles quickly, multiple fetches may overlap. Using an AbortController passed into fetch would allow canceling earlier requests.
  - The code calls `res.json().catch(() => ({}))` to avoid throwing; ensure `res.ok` check is used properly (it is).
  - If `datas` is large, computing `memberIds` and filtering may be expensive — consider server endpoint to return non-members directly.

---

## 2) Fetch team members (initial load and when accessToken/teamId change)

Code:

```tsx
React.useEffect(() => {
  if (!accessToken || !teamId) return;
  let mounted = true;
  (async () => {
    setLoading(true);
    setError(null);
    try {
      // fetch all users, then filter by membership in the team using the teams/members API
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Failed to fetch users", json);
        if (mounted) setError(json.error || "Failed to fetch users");
        return;
      }

      const users = json.users ?? [];

      const members = await Promise.all(
        users.map(async (u: any) => {
          try {
            const r = await fetch(`/api/admin/teams/members?userId=${u.id}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const jr = await r.json().catch(() => ({}));
            if (!r.ok) return null;
            const teamsForUser = jr.teamId ?? [];
            const isMember =
              Array.isArray(teamsForUser) &&
              teamsForUser.some((t: any) => String(t.id) === String(teamId));
            if (isMember) {
              return {
                id: u.id,
                mail: u.email ?? "",
                username: u.fullName ?? "",
                row: u.role ?? "",
                date: u.createdAt
                  ? new Date(u.createdAt).toISOString().split("T")[0]
                  : "",
              } as UserRow;
            }
          } catch (err) {
            console.error("Error checking membership for user", u.id, err);
            return null;
          }
          return null;
        })
      );

      const filtered = members.filter(Boolean) as UserRow[];
      if (mounted) setDatas(filtered);
    } catch (err) {
      console.error("Error fetching users", err);
      if (mounted) setError("Error fetching users");
    } finally {
      if (mounted) setLoading(false);
    }
  })();
  return () => {
    mounted = false;
  };
}, [accessToken, teamId]);
```

Explanation:

- Purpose: Build the list of team members shown in the page. The effect fetches all users, then for each user fetches their teams via `/api/admin/teams/members?userId=...` and keeps users that are members of the current `teamId`.

- Why two-step fetch: The code uses the users endpoint as the authoritative list of users and then asks the teams/members endpoint for each user to check membership. This is a flexible but chatty approach.

- Mounted guard: Same pattern as previous effect. The local `mounted` boolean prevents setting state after unmount.

- Dependencies: `[accessToken, teamId]` — it runs on mount and whenever the token or team id changes. `datas` is intentionally not included because this effect replaces `datas` with the computed members set.

- Performance and race conditions:

  - This effect issues N+1 requests (1 to get users, N to check membership). For teams with many users this will be slow and inefficient. Prefer a server API that accepts `teamId` and returns members directly, or a single endpoint that returns users filtered by team.
  - Overlapping requests: if `accessToken` or `teamId` changes rapidly, previous requests may finish later and overwrite state. Mounted guard prevents writes after unmount, but does not cancel in-flight fetches. Use AbortController or track a request identifier to ignore stale responses.

- Error handling: The effect sets `error` on failures and logs details. It attempts to continue and ignore per-user fetch failures by returning null for that user.

---

## 3) Keep current page within bounds when filtered pages change

Code:

```tsx
React.useEffect(() => {
  if (page > filteredTotalPages) setPage(filteredTotalPages);
}, [page, filteredTotalPages]);
```

Explanation:

- Purpose: If the current page number exceeds the number of available pages (e.g., after filtering or deletion), clamp the current page down to the last available page.

- Dependencies: Re-runs when either `page` or `filteredTotalPages` changes. If `page` is already <= `filteredTotalPages` nothing happens.

- Mounted/unmounted: Synchronous and short; no async work and no cleanup required.

---

## 4) Reset pagination when search query changes

Code:

```tsx
React.useEffect(() => {
  setPage(1);
}, [searchQuery]);
```

Explanation:

- Purpose: When the search query changes, reset the page to 1 so users see the first page of search results.

- Dependencies: Only `searchQuery` — any change sets page to 1.

- Mounted/unmounted: Synchronous and safe.

---

## Recommendations & notes for this file

- Consider replacing the N+1 membership checks with a single `/api/admin/teams/members?teamId=...` endpoint that returns member user objects. This will simplify the code and avoid many round-trips.
- Replace the `mounted` flag with an AbortController-based pattern to cancel fetches and free network resources. Example:
  - Create an AbortController per effect, pass `signal` to `fetch`, and call `controller.abort()` in the cleanup.
  - Check `if (err.name === 'AbortError')` to ignore aborted fetches.
- If `datas` is large and used in the `showAddDialog` effect, memoize derived values (e.g., `memberIds`) or move filtering to server for better performance.
