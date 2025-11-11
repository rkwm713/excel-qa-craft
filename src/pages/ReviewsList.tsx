import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ReviewListItem } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useReviews, useDeleteReview } from "@/hooks/useReviews";
import { FileText, Search, LogOut, User, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 20;

export default function ReviewsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const { data: reviews = [], isLoading, error } = useReviews(undefined, ITEMS_PER_PAGE, offset);
  const deleteReview = useDeleteReview();

  useEffect(() => {
    loadUser();
  }, []);

  const filteredReviews = useMemo(() => {
    if (searchQuery.trim() === "") {
      return reviews;
    }
    const query = searchQuery.toLowerCase();
    return reviews.filter(
      (review) =>
        review.title.toLowerCase().includes(query) ||
        review.description?.toLowerCase().includes(query) ||
        review.file_name?.toLowerCase().includes(query) ||
        review.username?.toLowerCase().includes(query)
    );
  }, [searchQuery, reviews]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        // Get user data if needed
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(userData || { id: user.id, email: user.email });
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      // Not logged in
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading reviews",
        description: error.message || "Failed to load reviews",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out",
    });
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await deleteReview.mutateAsync(reviewToDelete);
      toast({
        title: "Review deleted",
        description: "The review has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting review",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-saira uppercase tracking-wide text-primary">
              QA Reviews
            </h1>
            <p className="text-muted-foreground font-neuton mt-1">
              View and manage all QA review sessions
            </p>
          </div>
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span className="font-semibold">{currentUser.username}</span>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Review
            </Button>
            {currentUser && (
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search reviews by title, description, file name, or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Reviews Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {searchQuery ? "No reviews match your search" : "No reviews yet. Create your first review!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-saira">{review.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {review.description || "No description"}
                      </CardDescription>
                    </div>
                    {currentUser && currentUser.id === review.created_by && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(review.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {review.file_name && (
                      <Badge variant="outline" className="text-xs">
                        {review.file_name}
                      </Badge>
                    )}
                    {review.pdf_file_name && (
                      <Badge variant="outline" className="text-xs">
                        PDF: {review.pdf_file_name}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Created by: <span className="font-semibold">{review.username || review.full_name || "Unknown"}</span>
                    </p>
                    <p>
                      Updated: {format(new Date(review.updated_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/review/${review.id}`)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Review
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredReviews.length > 0 && searchQuery.trim() === "" && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {offset + 1} to {Math.min(offset + ITEMS_PER_PAGE, reviews.length)} of {reviews.length} reviews
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {currentPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={reviews.length < ITEMS_PER_PAGE || isLoading}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReviewToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

