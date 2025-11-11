import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { reviewsAPI, ReviewListItem } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Search, LogOut, User, Plus, Trash2, TrendingUp, Calendar, FileSpreadsheet, Map as MapIcon } from "lucide-react";
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
import { LoginDialog } from "@/components/LoginDialog";
import techservLogo from "@/assets/techserv-logo.png";

export default function Index() {
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
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
        reviews.filter(
          (review) =>
            review.title.toLowerCase().includes(query) ||
            review.description?.toLowerCase().includes(query) ||
            review.file_name?.toLowerCase().includes(query) ||
            review.username?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, reviews]);

  const loadUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setCurrentUser(null);
      } else {
        setCurrentUser(data.user);
      }
    } catch (error) {
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

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setShowLoginDialog(false);
    loadReviews();
  };

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

  // Calculate stats
  const stats = {
    total: reviews.length,
    recent: reviews.filter(r => {
      const daysSince = (Date.now() - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length,
    myReviews: currentUser ? reviews.filter(r => r.created_by === currentUser.id).length : 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img 
                src={techservLogo} 
                alt="TechServ" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold font-saira uppercase tracking-wide text-primary">
                  QA Tool Dashboard
                </h1>
                <p className="text-sm text-muted-foreground font-neuton">
                  Manage and review all QA review sessions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {currentUser && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span className="font-semibold">{currentUser.username}</span>
                </div>
              )}
              <Button
                onClick={() => navigate("/new-review")}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                <Plus className="w-4 h-4" />
                New Review
              </Button>
              {currentUser ? (
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setShowLoginDialog(true)} className="gap-2">
                  <User className="w-4 h-4" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-saira">Total Reviews</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-saira">{stats.total}</div>
              <p className="text-xs text-muted-foreground font-neuton">
                All QA review sessions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-saira">Recent Reviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-saira">{stats.recent}</div>
              <p className="text-xs text-muted-foreground font-neuton">
                Updated in last 7 days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-saira">My Reviews</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-saira">{stats.myReviews}</div>
              <p className="text-xs text-muted-foreground font-neuton">
                {currentUser ? "Reviews you created" : "Login to see your reviews"}
              </p>
            </CardContent>
          </Card>
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
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery ? "No reviews match your search" : "No reviews yet. Create your first review!"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => navigate("/new-review")}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Review
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/review/${review.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-saira mb-1">{review.title}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {review.description || "No description"}
                      </CardDescription>
                    </div>
                    {currentUser && currentUser.id === review.created_by && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(review.id);
                        }}
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
                        <FileSpreadsheet className="w-3 h-3 mr-1" />
                        {review.file_name}
                      </Badge>
                    )}
                    {review.pdf_file_name && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        PDF
                      </Badge>
                    )}
                    {review.kmz_file_name && (
                      <Badge variant="outline" className="text-xs">
                        <MapIcon className="w-3 h-3 mr-1" />
                        KMZ
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="font-semibold">{review.username || review.full_name || "Unknown"}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Updated: {format(new Date(review.updated_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/review/${review.id}`);
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Review
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

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

      {/* Login Dialog */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
