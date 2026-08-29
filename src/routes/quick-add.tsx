import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Entry point for the `myapp://quick-add` deep link (iOS Shortcuts, Android
 * intents). It simply forwards the parameters to the add-transaction screen.
 */
export const Route = createFileRoute("/quick-add")({
  validateSearch: (search: Record<string, unknown>) => search,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/transactions/new", search: search as never });
  },
  component: () => null,
});
