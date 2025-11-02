import { useState, useEffect } from "react";
import { Objective, ProductContext } from "@enthalpy/shared";

export interface ContextData {
  objective: Objective | null;
  productName: string;
  productUrl: string;
}

export interface UseContextResult {
  contextData: ContextData;
  loading: boolean;
  error: string | null;
}

interface UseContextParams {
  userId: number;
  projectId: number;
}

const useContext = ({ userId, projectId }: UseContextParams): UseContextResult => {
  const [contextData, setContextData] = useState<ContextData>({
    objective: null,
    productName: "",
    productUrl: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch both objective context and product context in parallel
        const [objectiveResponse, productContextResponse] = await Promise.all([
          fetch(`/api/context/objectivecontext?user_id=${userId}&project_id=${projectId}`),
          fetch(`/api/context/productcontext?user_id=${userId}&project_id=${projectId}`),
        ]);

        let objective: Objective | null = null;
        let productName = "";
        let productUrl = "";

        // Process objective context
        if (objectiveResponse.ok) {
          const objectiveData = await objectiveResponse.json();
          if (objectiveData.success && objectiveData.data) {
            objective = objectiveData.data;
          }
        } else if (objectiveResponse.status !== 404) {
          // Only log error if it's not a 404 (not found is acceptable)
          console.error("Failed to fetch objective context:", objectiveResponse.statusText);
        }

        // Process product context
        if (productContextResponse.ok) {
          const productContextData = await productContextResponse.json();
          if (productContextData.success && productContextData.data) {
            const contexts: ProductContext[] = productContextData.data;

            // Find the last product-name context
            const productNameContexts = contexts.filter(ctx => ctx.type === "product-name");
            if (productNameContexts.length > 0) {
              const lastProductName = productNameContexts[productNameContexts.length - 1];
              productName = lastProductName.content;
            }

            // Find the last product-page-url context
            const productUrlContexts = contexts.filter(ctx => ctx.type === "product-page-url");
            if (productUrlContexts.length > 0) {
              const lastProductUrl = productUrlContexts[productUrlContexts.length - 1];
              productUrl = lastProductUrl.content;
            }
          }
        } else if (productContextResponse.status !== 404) {
          console.error("Failed to fetch product context:", productContextResponse.statusText);
        }

        setContextData({
          objective,
          productName,
          productUrl,
        });
      } catch (err: any) {
        setError(err.message || "Network error fetching context.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [userId, projectId]);

  return { contextData, loading, error };
};

export default useContext;
