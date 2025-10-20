/**
 * Custom hooks for managing endpoint and model selection via URL query params
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Endpoint, Model } from './types';

/**
 * Hook to manage endpoint selection via URL query param `?e=endpoint-id`
 *
 * - Fetches endpoints from /api/endpoints
 * - Reads current selection from query param
 * - Auto-selects first endpoint if none specified
 * - Updates query param when selection changes
 */
export function useEndpointFromQuery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch endpoints on mount
  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/endpoints');

        if (!response.ok) {
          throw new Error(`Failed to fetch endpoints: ${response.statusText}`);
        }

        const data: Endpoint[] = await response.json();
        setEndpoints(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to fetch endpoints:', message);
        setError(message);
        setEndpoints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEndpoints();
  }, []);

  // Sync selected endpoint with query param
  useEffect(() => {
    if (endpoints.length === 0) {
      setSelectedEndpoint(null);
      return;
    }

    const endpointIdFromQuery = searchParams.get('e');

    // Try to find endpoint from query param
    const endpoint = endpointIdFromQuery
      ? endpoints.find((e) => e.id === endpointIdFromQuery)
      : null;

    // Auto-select first if no valid selection
    const finalSelection = endpoint ?? endpoints[0];

    setSelectedEndpoint(finalSelection);

    // Update query param if needed
    if (finalSelection && finalSelection.id !== endpointIdFromQuery) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('e', finalSelection.id);
      setSearchParams(newParams, { replace: true });
    }
  }, [endpoints, searchParams, setSearchParams]);

  // Function to select an endpoint by ID
  const selectEndpoint = (endpointId: string | null) => {
    if (!endpointId) return;

    const endpoint = endpoints.find((e) => e.id === endpointId);
    if (!endpoint) return;

    const newParams = new URLSearchParams(searchParams);
    newParams.set('e', endpointId);
    setSearchParams(newParams);
  };

  return {
    endpoints,
    selectedEndpoint,
    selectEndpoint,
    loading,
    error,
  };
}

/**
 * Hook to manage model selection via URL query param `?m=model-id`
 *
 * - Fetches models from /api/models?endpointId=xxx when endpoint changes
 * - Reads current selection from query param
 * - Auto-selects first model if none specified
 * - Updates query param when selection changes
 */
export function useModelFromQuery(endpointId: string | null) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch models when endpoint changes
  useEffect(() => {
    if (!endpointId) {
      setModels([]);
      setSelectedModel(null);
      return;
    }

    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ endpointId });
        const response = await fetch(`/api/models?${params}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data: Model[] = await response.json();
        setModels(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to fetch models:', message);
        setError(message);
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [endpointId]);

  // Sync selected model with query param
  useEffect(() => {
    if (models.length === 0) {
      setSelectedModel(null);
      return;
    }

    const modelIdFromQuery = searchParams.get('m');

    // Try to find model from query param
    const model = modelIdFromQuery
      ? models.find((m) => m.id === modelIdFromQuery)
      : null;

    // Auto-select first if no valid selection
    const finalSelection = model ?? models[0];

    setSelectedModel(finalSelection);

    // Update query param if needed
    if (finalSelection && finalSelection.id !== modelIdFromQuery) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('m', finalSelection.id);
      setSearchParams(newParams, { replace: true });
    }
  }, [models, searchParams, setSearchParams]);

  // Function to select a model by ID
  const selectModel = (modelId: string | null) => {
    if (!modelId) return;

    const model = models.find((m) => m.id === modelId);
    if (!model) return;

    const newParams = new URLSearchParams(searchParams);
    newParams.set('m', modelId);
    setSearchParams(newParams);
  };

  return {
    models,
    selectedModel,
    selectModel,
    loading,
    error,
  };
}
