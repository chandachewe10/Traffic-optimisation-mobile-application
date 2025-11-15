import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useEffect } from "react";

export function useAllRoutes() {
  const routes = useQuery(api.routes.listAllRoutes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (routes !== undefined) {
      setLoading(false);
    }
  }, [routes]);

  return { routes: routes || [], loading };
}

export function useRouteWithPrediction(routeId: string | null) {
  const route = useQuery(
    routeId ? api.routes.getRouteWithPrediction : null,
    routeId ? { routeId } : "skip"
  );
  const [loading, setLoading] = useState(!!routeId);

  useEffect(() => {
    if (!routeId) {
      setLoading(false);
    } else if (route !== undefined) {
      setLoading(false);
    }
  }, [route, routeId]);

  return { route, loading };
}

export function useRouteWaypoints(routeId: string | null) {
  const waypoints = useQuery(
    routeId ? api.routes.getRouteWaypoints : null,
    routeId ? { routeId } : "skip"
  );
  const [loading, setLoading] = useState(!!routeId);

  useEffect(() => {
    if (!routeId) {
      setLoading(false);
    } else if (waypoints !== undefined) {
      setLoading(false);
    }
  }, [waypoints, routeId]);

  return { waypoints: waypoints || [], loading };
}

export function useOptimizedRoute(routeId: string | null) {
  const optimized = useQuery(
    routeId ? api.routes.getOptimizedRoute : null,
    routeId ? { routeId } : "skip"
  );
  const [loading, setLoading] = useState(!!routeId);

  useEffect(() => {
    if (!routeId) {
      setLoading(false);
    } else if (optimized !== undefined) {
      setLoading(false);
    }
  }, [optimized, routeId]);

  return { optimized, loading };
}

export function useSearchRoutes(query: string) {
  const results = useQuery(api.routes.searchRoutes, { query });
  return results || [];
}

export function useInitializeSampleData() {
  const initMutation = useMutation(api.routes.initializeSampleData);
  return initMutation;
}

export function useSavedRoutes(userId: string = "default") {
  const routes = useQuery(api.savedRoutes.getSavedRoutes, { userId });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (routes !== undefined) {
      setLoading(false);
    }
  }, [routes]);

  return { routes: routes || [], loading };
}

export function useSaveRoute() {
  return useMutation(api.savedRoutes.saveRoute);
}

export function useDeleteSavedRoute() {
  return useMutation(api.savedRoutes.deleteSavedRoute);
}

export function useGetAddressSuggestions() {
  return useAction(api.geocoding.getAddressSuggestions);
}

export function useGeocodeAddress() {
  return useAction(api.geocoding.geocodeAddress);
}

export function useGetGoogleMapsRoute() {
  return useAction(api.geocoding.getGoogleMapsRoute);
}