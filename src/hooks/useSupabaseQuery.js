import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useSupabaseQuery = (key, queryFn, options = {}) => {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn,
    staleTime: options.staleTime || 1000 * 60 * 5, // Default 5 minutes
    cacheTime: options.cacheTime || 1000 * 60 * 30, // Default 30 minutes
    ...options,
  });
};

export const useSupabaseMutation = (key, mutationFn, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (Array.isArray(key)) {
        key.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      } else {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      
      // Call custom onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    ...options,
  });
};