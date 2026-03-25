"use client";
// components/providers.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { OnlineWatcher } from "./online-watcher";

export function AppProviders({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <OnlineWatcher />
      {children}
    </QueryClientProvider>
  );
}
