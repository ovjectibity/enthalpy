import { useState, useEffect } from "react";
import { Hypothesis } from "@enthalpy/shared";

export interface UseHypothesesResult {
  hypothesesList: Hypothesis[];
  loading: boolean;
  error: string | null;
}

const useHypotheses = (): UseHypothesesResult => {
  const [hypothesesList, setHypothesesList] = useState<Hypothesis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHypotheses = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace 'yourUserId' with the actual user ID, perhaps passed as an argument to the hook
        const response = await fetch("/api/hypotheses?userId=yourUserId");
        if (!response.ok) {
          throw new Error(`Failed to fetch hypotheses: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success) {
          setHypothesesList(data.hypotheses);
        } else {
          setError(data.error || "Unknown error fetching hypotheses.");
          console.error("Error fetching hypotheses:", data.error);
        }
      } catch (err: any) {
        setError(err.message || "Network error fetching hypotheses.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHypotheses();
  }, []); // Empty dependency array means this effect runs once on mount

  return { hypothesesList, loading, error };
};

export default useHypotheses;
