import { useState, useEffect } from "react";
import { Thread, PaginatedResponse } from "@enthalpy/shared";

export interface UseThreadsResult {
  threads: Map<number,Thread>;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
}

const getMapFromThreads = (threads: Thread[]): Map<number,Thread> => {
  let threadMap = new Map<number, Thread>();
  for(const thread of threads) {
    threadMap.set(thread.threadId, thread);
  }
  return threadMap;
};

interface UseThreadsOptions {
  userId: number;
  projectId: number;
  page?: number;
  limit?: number;
}

const useThreads = (options: UseThreadsOptions): UseThreadsResult => {
  const [threadsList, setThreadsList] = useState<Map<number,Thread>>(new Map<number,Thread>());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseThreadsResult['pagination']>(null);

  // Use hardcoded defaults but allow overrides
  const userId = options.userId;
  const projectId = options.projectId;
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;

  const fetchThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/threads/user/${userId}/project/${projectId}?page=${page}&limit=${limit}&sortBy=timestamp&sortOrder=desc`);

      if (!response.ok) {
        throw new Error(`Failed to fetch threads: ${response.statusText}`);
      }

      const data: PaginatedResponse<Thread> = await response.json();

      if (data.success) {
        setThreadsList(getMapFromThreads(data.data));
        setPagination(data.pagination);
      } else {
        setError(data.error || "Unknown error fetching threads.");
        console.error("Error fetching threads:", data.error);
      }
    } catch (err: any) {
      setError(err.message || "Network error fetching threads.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [userId, projectId, page, limit]); // Re-fetch when parameters change

  return {
    threads: threadsList,
    loading,
    error,
    pagination,
    refetch: fetchThreads
  };
};

export default useThreads;
