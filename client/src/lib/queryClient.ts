import { QueryClient, QueryFunction, QueryKey } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // If we can't parse JSON, try to get text
      try {
        const text = await res.text();
        if (text) errorMessage = text;
      } catch (textError) {
        // If we can't get text either, use the status text
      }
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request error (${method} ${url}):`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }: { queryKey: QueryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Query error (${queryKey[0]}):`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount: number, error: unknown) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.match(/^4\d\d:/)) {
          return false;
        }
        return failureCount < 2; // Retry other errors up to 2 times
      },
    },
    mutations: {
      retry: (failureCount: number, error: unknown) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.match(/^4\d\d:/)) {
          return false;
        }
        return failureCount < 2; // Retry other errors up to 2 times
      },
    },
  },
});
