import { useState, useEffect } from "react";
import { Metric } from "@enthalpy/shared";

export interface UseMetricsResult {
  metricsList: Metric[];
  loading: boolean;
  error: string | null;
}

const useMetrics = (projectId: number, userId: number): UseMetricsResult => {
  const [metricsList, setMetricsList] = useState<Metric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/metrics/${projectId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success) {
          setMetricsList(data.data);
        } else {
          setError(data.error || "Unknown error fetching metrics.");
          console.error("Error fetching metrics:", data.error);
        }
      } catch (err: any) {
        setError(err.message || "Network error fetching metrics.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [projectId, userId]);

  return { metricsList, loading, error };
};

export default useMetrics;