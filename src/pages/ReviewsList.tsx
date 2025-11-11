import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { reviewsAPI, ReviewListItem } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Search, LogOut, User, Plus, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ReviewsList() {
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUser();
    loadReviews();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredReviews(reviews);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredReviews(
        reviews.filter((review) => {
          const haystacks = [
            review.title,
            review.description ?? "",
            review.file_name ?? "",
            review.wo_number ?? "",
            review.designer ?? "",
            review.qa_tech ?? "",
            review.project ?? "",
            review.status ?? "",
            review.username ?? "",
            review.full_name ?? "",
          ]
            .filter(Boolean)
            .map((value) => value.toLowerCase());

          return haystacks.some((value) => value.includes(query));
        })
      );
    }
  }, [searchQuery, reviews]);

  const loadUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        // Get user data if needed
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(profile || { id: user.id, email: user.email });
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      // Not logged in
      setCurrentUser(null);
    }
  };

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const response = await reviewsAPI.list();
      setReviews(response.reviews);
      setFilteredReviews(response.reviews);
    } catch (error: any) {
      toast({
        title: "Error loading reviews",
        description: error.message || "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out",
    });
    navigate("/");
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await reviewsAPI.delete(reviewToDelete);
      toast({
        title: "Review deleted",
        description: "The review has been deleted successfully",
      });
      loadReviews();
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
              onClick={() => navigate("/new-review")}
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
            placeholder="Search reviews by title, WO#, project, designer, status, or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title & Description</TableHead>
                    <TableHead>WO#</TableHead>
                    <TableHead>Designer</TableHead>
                    <TableHead>QA Tech</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4].map((row) => (
                    <TableRow key={row}>
                      <TableCell>
                        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                        <div className="mt-2 h-3 w-64 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="ml-auto h-9 w-24 rounded bg-muted animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title & Description</TableHead>
                    <TableHead>WO#</TableHead>
                    <TableHead>Designer</TableHead>
                    <TableHead>QA Tech</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id} className="hover:bg-muted/50 transition">
                      <TableCell>
                        <p className="text-sm font-semibold font-saira text-foreground">{review.title}</p>
                        <p className="text-xs text-muted-foreground font-neuton line-clamp-2 mt-1">
                          {review.description || "No description"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {review.wo_number ? (
                          <Badge variant="outline" className="font-saira text-xs">
                            {review.wo_number}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-neuton">
                        {review.designer || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm font-neuton">
                        {review.qa_tech || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm font-neuton">
                        {review.project || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {review.status ? (
                          <Badge variant="secondary" className="text-xs font-saira uppercase tracking-wide">
                            {review.status}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-neuton">
                        {format(new Date(review.updated_at), "MMM d, yyyy 'at' h:mm a")}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/review/${review.id}`)}
                          className="gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          View
                        </Button>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
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

