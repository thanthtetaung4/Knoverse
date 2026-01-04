# manage-users/page.tsx — useEffect explanations

This document explains each useEffect in `app/admin/manage-users/page.tsx`. For each effect you will find the original code snippet followed by a detailed explanation of the logic, dependencies, mounted/unmounted handling, and potential pitfalls.

---

## 1) Fetch real users on mount (and when accessToken changes)

Code:

```tsx
React.useEffect(() => {
  if (!accessToken) return;
  let mounted = true;
  (async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("Failed to fetch users", json);
        if (mounted) setError(json.error || "Failed to fetch users");
      } else {
        const users = json.users ?? [];
        if (mounted)
          setDatas(
            users.map(
              (
                u: {
                  id?: string | number;
                  email?: string;
                  fullName?: string;
                  role?: string;
                  createdAt?: string | number;
                },
                i: number
              ) => ({
                id: u.id ?? i + 1,
                mail: u.email ?? "",
                username: u.fullName ?? "",
                row: u.role ?? "",
                date: u.createdAt
                  ? new Date(u.createdAt).toISOString().split("T")[0]
                  : "",
              })
            )
          );
      }
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
}, [accessToken]);
```

Explanation:

- Purpose: Populate the page with a list of users fetched from `/api/admin/users` when the component mounts and whenever the `accessToken` changes (i.e., the identity used for API calls changed).

- Mounted guard: Uses a `mounted` boolean to prevent updating state after the component has unmounted, particularly because the effect performs asynchronous fetches. The cleanup function sets `mounted = false`.

- Dependencies: `[accessToken]` — only runs when accessToken becomes available or changes.

- Error handling: Sets `error` to show UI feedback when the fetch fails. Logs details for debugging.

- Notes and suggestions:
  - If `accessToken` may change frequently, consider debouncing or aborting previous requests to avoid race conditions.
  - Use AbortController to cancel in-flight fetches on cleanup instead of only relying on `mounted` flag.

---

## 2) Keep current page within bounds when filtered pages change

Code:

```tsx
React.useEffect(() => {
  if (page > filteredTotalPages) setPage(filteredTotalPages);
}, [page, filteredTotalPages]);
```

Explanation:

- Purpose: Ensure the current page index stays within the valid range after filtering or data changes.

- Dependencies: `page` and `filteredTotalPages`.

- Notes: No async work; no cleanup required.

---

## 3) Reset pagination when search query changes

Code:

```tsx
React.useEffect(() => {
  setPage(1);
}, [searchQuery]);
```

Explanation:

- Purpose: When search query changes, reset to first page.

- Notes: No async work; no cleanup required.

---

## Recommendations

- Replace `mounted` flags with AbortController for cancelable fetches.
- Centralize user-fetching logic into a single hook or service to avoid duplication between pages.
- Add retry/backoff or show more detailed error information when fetches fail.
