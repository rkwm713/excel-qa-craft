import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navbar, NavbarActions, NavbarBrand, NavbarNav, NavbarLink } from "@/components/ui/navbar";
import { reviewsAPI, ReviewListItem } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Search, Plus, Trash2, TrendingUp, Calendar, FileSpreadsheet, Map as MapIcon } from "lucide-react";
import { TechServLogo } from "@/components/brand/TechServLogo";
import { UserProfileMenu } from "@/components/UserProfileMenu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-white/95 shadow-brand-sm backdrop-blur">
        <div className="flex flex-col gap-3 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <TechServLogo variant="primary" width={160} />
              <div className="space-y-1">
                <h1 className="text-3xl font-saira font-bold uppercase tracking-[0.08em] text-[hsl(var(--color-primary))]">
                  QA Tool Dashboard
                </h1>
                <p className="font-neuton text-sm text-[hsl(var(--color-secondary))]">
                  Manage QA reviews with TechServ’s unified brand system
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate("/new-review")} className="gap-2">
                <Plus className="w-4 h-4" />
                New Review
              </Button>
              <div className="h-8 w-px bg-[hsl(var(--border))]" />
              <UserProfileMenu
                user={currentUser}
                onLogin={() => setShowLoginDialog(true)}
                onLogout={handleLogout}
              />
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsla(var(--color-light)/0.4)] px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 text-sm font-neuton text-[hsl(var(--color-secondary))]">
              <span className="font-saira text-xs uppercase tracking-[0.12em] text-[hsl(var(--color-primary))]">
                Today’s Overview
              </span>
              <span>Total reviews: {stats.total}</span>
              <span>Updated this week: {stats.recent}</span>
              <span>My reviews: {stats.myReviews}</span>
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
            placeholder="Search reviews by title, WO#, project, designer, status, or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {isLoading ? (
            <Table wrapperClassName="overflow-hidden">
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
                  {[1, 2, 3, 4, 5].map((row) => (
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
            <Table wrapperClassName="overflow-hidden">
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
                    <TableRow
                      key={review.id}
                      className="cursor-pointer hover:bg-muted/50 transition"
                      onClick={() => navigate(`/review/${review.id}`)}
                    >
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
                        {format(new Date(review.updated_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/review/${review.id}`);
                          }}
                          className="gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          View
                        </Button>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </div>
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
