import { useState } from "react";
import {
  useListClubApplications,
  useUpdateClubApplication,
  useDeleteClubApplication,
  getListClubApplicationsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, XCircle, Trash2, Loader2, Heart, User, Mail,
  Phone, Calendar, Dumbbell, MessageSquare, ChevronLeft, Clock,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type Status = "pending" | "accepted" | "rejected";

function statusBadge(status: string) {
  if (status === "accepted") return <Badge className="bg-green-600 text-white">Accepted</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>;
}

export default function AdminClubApplications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("pending");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: number; status: Status } | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: applications, isLoading } = useListClubApplications(
    activeTab !== "all" ? { status: activeTab as Status } : undefined
  );

  const updateMutation = useUpdateClubApplication({
    mutation: {
      onSuccess: () => {
        toast({ title: pendingAction?.status === "accepted" ? "Application accepted!" : "Application rejected" });
        queryClient.invalidateQueries({ queryKey: getListClubApplicationsQueryKey() });
        setNoteDialogOpen(false);
        setPendingAction(null);
        setAdminNote("");
      },
      onError: () => toast({ variant: "destructive", title: "Update failed" }),
    },
  });

  const deleteMutation = useDeleteClubApplication({
    mutation: {
      onSuccess: () => {
        toast({ title: "Application deleted" });
        queryClient.invalidateQueries({ queryKey: getListClubApplicationsQueryKey() });
        setDeleteId(null);
      },
      onError: () => toast({ variant: "destructive", title: "Delete failed" }),
    },
  });

  const openAction = (id: number, status: Status) => {
    setPendingAction({ id, status });
    setAdminNote("");
    setNoteDialogOpen(true);
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    updateMutation.mutate({ id: pendingAction.id, data: { status: pendingAction.status, adminNote: adminNote || undefined } });
  };

  const counts = {
    pending: applications?.filter(a => a.status === "pending").length,
    accepted: applications?.filter(a => a.status === "accepted").length,
    rejected: applications?.filter(a => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4 mr-1" /> Dashboard</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase italic flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" /> Club Applications
          </h1>
          <p className="text-muted-foreground text-sm">Review and manage KSB membership applications</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="pending">
            Pending {activeTab === "pending" && applications ? `(${applications.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {["pending", "accepted", "rejected", "all"].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !applications?.length ? (
              <Card className="border-dashed">
                <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
                  <Heart className="h-10 w-10 text-muted-foreground opacity-20" />
                  <p className="font-medium text-muted-foreground">No {tab !== "all" ? tab : ""} applications</p>
                </CardContent>
              </Card>
            ) : (
              applications.map(app => (
                <Card key={app.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">{app.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(app.createdAt), "d MMM yyyy, HH:mm")}
                          </p>
                        </div>
                      </div>
                      {statusBadge(app.status)}
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <a href={`mailto:${app.email}`} className="hover:text-foreground underline truncate">{app.email}</a>
                      </div>
                      {app.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{app.phone}</span>
                        </div>
                      )}
                      {app.dob && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>DOB: {app.dob}</span>
                        </div>
                      )}
                      {app.position && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Dumbbell className="h-4 w-4 flex-shrink-0" />
                          <span>{app.position}</span>
                        </div>
                      )}
                      {app.message && (
                        <div className="md:col-span-2 flex items-start gap-2 text-muted-foreground">
                          <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{app.message}</p>
                        </div>
                      )}
                      {app.adminNote && (
                        <div className="md:col-span-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                          <span className="font-bold uppercase tracking-wider text-muted-foreground">Admin note: </span>
                          {app.adminNote}
                        </div>
                      )}
                    </div>

                    {app.status === "pending" && (
                      <div className="px-4 pb-4 flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={() => openAction(app.id, "accepted")}>
                          <CheckCircle2 className="h-4 w-4 mr-1.5" /> Accept
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => openAction(app.id, "rejected")}>
                          <XCircle className="h-4 w-4 mr-1.5" /> Reject
                        </Button>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(app.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {app.status !== "pending" && (
                      <div className="px-4 pb-4 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openAction(app.id, app.status === "accepted" ? "rejected" : "accepted")}>
                          Change to {app.status === "accepted" ? "Rejected" : "Accepted"}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(app.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Accept/Reject dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={pendingAction?.status === "accepted" ? "text-green-600" : "text-destructive"}>
              {pendingAction?.status === "accepted" ? "✓ Accept Application" : "✕ Reject Application"}
            </DialogTitle>
            <DialogDescription>
              Optionally add a note before confirming.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Admin note (optional) — e.g. 'Welcome! Training starts Monday.'"
            rows={3}
            value={adminNote}
            onChange={e => setAdminNote(e.target.value)}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
            <Button
              className={pendingAction?.status === "accepted" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              variant={pendingAction?.status === "rejected" ? "destructive" : "default"}
              onClick={confirmAction}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm {pendingAction?.status === "accepted" ? "Accept" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
