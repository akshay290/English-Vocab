---
name: Wouter v3 Routing Pattern
description: How to structure routes in Wouter v3 to avoid blank renders with nested Switch inside /:rest*
---

## Rule
Do NOT wrap AppLayout in a `<Route path="/:rest*">` and nest a `<Switch>` inside it. This causes blank renders in Wouter v3 because the inner Switch sees the full path but the outer route match changes how paths are resolved.

**Why:** In Wouter v3, nested routes inside a matched Route do not automatically strip the matched prefix. The `/:rest*` pattern eats the match but inner Switch may not re-resolve correctly depending on Wouter internals.

**How to apply:** Use a flat outer Switch with specific admin routes first, then a catch-all `<Route>` (no path) wrapping AppLayout with an inner Switch for all app routes.

```tsx
<Switch>
  <Route path="/admin" component={AdminLogin} />
  <AdminRoute path="/admin/dashboard" component={...} />
  
  {/* Catch-all — renders AppLayout for everything else */}
  <Route>
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        ...
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  </Route>
</Switch>
```
