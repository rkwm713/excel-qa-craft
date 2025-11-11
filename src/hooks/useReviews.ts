import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewsAPI, ReviewListItem, ReviewData } from "@/services/api";

export function useReviews(createdBy?: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ["reviews", createdBy, limit, offset],
    queryFn: () => reviewsAPI.list(createdBy, limit, offset).then((res) => res.reviews),
    keepPreviousData: true,
  });
}

export function useReview(id: string | undefined) {
  return useQuery({
    queryKey: ["review", id],
    queryFn: () => {
      if (!id) throw new Error("Review ID is required");
      return reviewsAPI.get(id);
    },
    enabled: !!id,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: reviewsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof reviewsAPI.update>[1] }) =>
      reviewsAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review", variables.id] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: reviewsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
