import {
  useListAllAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  useToggleAnnouncementPublish,
  getListAllAnnouncementsQueryKey,
  ListAllAnnouncementsStatus,
  AnnouncementInputCategory,
  AnnouncementUpdateCategory,
} from "@workspace/api-client-react";
import type { Announcement } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Plus, Pencil, Trash2, Globe, FileText, Search, Megaphone,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const CATEGORIES = ["General", "Match Update", "Tournament", "Training", "Membership"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  "Match Update": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Tournament: "bg-primary/15 text-primary border-primary/20",
  Training: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Membership: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

interface FormState {
  title: string;
  content: string;
  category: string;
  author: string;
  isPublished: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  content: "",
  category: "General",
  author: "Admin",
  isPublished: false,
};

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const queryParams = {
    status: statusFilter !== "all" ? (statusFilter as ListAllAnnouncementsStatus) : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    search: search || undefined,
  };

  const { data: announcements, isLoading } = useListAllAnnouncements(queryParams);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListAllAnnouncementsQueryKey() });

  const createMutation = useCreateAnnouncement({
    mutation: {
      onSuccess: () => { toast({ title: "Announcement created" }); invalidate(); setDialogOpen(false); },
      onError: () => toast({ variant: "destructive", title: "Failed to create" }),
    },
  });

  const updateMutation = useUpdateAnnouncement({
    mutation: {
      onSuccess: () => { toast({ title: "Announcement updated" }); invalidate(); setDialogOpen(false); },
      onError: () => toast({ variant: "destructive", title: "Failed to update" }),
    },
  });

  const deleteMutation = useDeleteAnnouncement({
    mutation: {
      onSuccess: () => { toast({ title: "Announcement deleted" }); invalidate(); setDeleteId(null); },
      onError: () => toast({ variant: "destructive", title: "Failed to delete" }),
    },
  });

  const publishMutation = useToggleAnnouncementPublish({
    mutation: {
      onSuccess: (_, vars) => {
        toast({ title: vars.data.isPublished ? "Published" : "Moved to draft" });
        invalidate();
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update" }),
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({ title: a.title, content: a.content, category: a.category, author: a.author, isPublished: a.isPublished });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editingId != null) {
      updateMutation.mutate({
        id: editingId,
        data: { ...form, category: form.category as AnnouncementUpdateCategory },
      });
    } else {
      createMutation.mutate({
        data: { ...form, category: form.category as AnnouncementInputCategory },
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" /> Announcements
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Publish news and updates to the club website
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !announcements?.length ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No announcements yet</p>
          <p className="text-sm mt-1">Click "New Announcement" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start gap-4 p-4">
                  {/* Status strip */}
                  <div
                    className={`w-1 self-stretch rounded-full flex-shrink-0 ${a.isPublished ? "bg-primary" : "bg-muted-foreground/30"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold truncate">{a.title}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs flex-shrink-0 ${a.isPublished ? "border-primary/30 text-primary bg-primary/10" : "text-muted-foreground"}`}
                          >
                            {a.isPublished ? <><Globe className="h-2.5 w-2.5 mr-1" />Published</> : <><FileText className="h-2.5 w-2.5 mr-1" />Draft</>}
                          </Badge>
                          <Badge variant="outline" className={`text-xs flex-shrink-0 ${CATEGORY_COLORS[a.category] ?? ""}`}>
                            {a.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          By {a.author} · {format(new Date(a.createdAt), "d MMM yyyy, HH:mm")}
                        </p>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant={a.isPublished ? "outline" : "default"}
                          className="h-8 gap-1 text-xs"
                          onClick={() => publishMutation.mutate({ id: a.id, data: { isPublished: !a.isPublished } })}
                          disabled={publishMutation.isPending && (publishMutation.variables as { id: number })?.id === a.id}
                        >
                          {publishMutation.isPending && (publishMutation.variables as { id: number })?.id === a.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : a.isPublished ? <><FileText className="h-3 w-3" />Unpublish</> : <><Globe className="h-3 w-3" />Publish</>
                          }
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(a.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Tournament day schedule confirmed"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Write your announcement here…"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={6}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Author</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  placeholder="Admin"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              variant="outline"
              onClick={() => { setForm((f) => ({ ...f, isPublished: false })); setTimeout(handleSave, 0); }}
              disabled={isSaving || !form.title.trim() || !form.content.trim()}
            >
              {isSaving && !form.isPublished ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
              Save as Draft
            </Button>
            <Button
              onClick={() => { setForm((f) => ({ ...f, isPublished: true })); setTimeout(handleSave, 0); }}
              disabled={isSaving || !form.title.trim() || !form.content.trim()}
            >
              {isSaving && form.isPublished ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Globe className="h-4 w-4 mr-1" />}
              Publish to Website
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId != null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the announcement. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId != null && deleteMutation.mutate({ id: deleteId })}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
