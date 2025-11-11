import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewsAPI, ReviewListItem, ReviewData } from "@/services/api";

export function useReviews(createdBy?: string) {
  return useQuery({
    queryKey: ["reviews", createdBy],
    queryFn: () => reviewsAPI.list(createdBy).then((res) => res.reviews),
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
