import { useListTeams, useUpdateTeam, getListTeamsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Users } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminTeams() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: teams, isLoading } = useListTeams();
  
  // Local state for editing
  const [edits, setEdits] = useState<Record<number, { name: string, shortName: string, primaryColor: string }>>({});

  useEffect(() => {
    if (teams) {
      const initialEdits: Record<number, any> = {};
      teams.forEach(team => {
        initialEdits[team.id] = {
          name: team.name,
          shortName: team.shortName,
          primaryColor: team.primaryColor || "#16a34a"
        };
      });
      setEdits(initialEdits);
    }
  }, [teams]);

  const updateMutation = useUpdateTeam({
    mutation: {
      onSuccess: () => {
        toast({ title: "Team updated successfully" });
        queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
      }
    }
  });

  const handleSave = (id: number) => {
    const edit = edits[id];
    if (edit) {
      updateMutation.mutate({
        id,
        data: edit
      });
    }
  };

  const handleEditChange = (id: number, field: string, value: string) => {
    setEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1">Update team names and primary colors</p>
        </div>
      </div>

      <div className="grid gap-6">
        {teams?.map(team => (
          <Card key={team.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: edits[team.id]?.primaryColor || team.primaryColor }}>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor={`name-${team.id}`}>Full Name</Label>
                  <Input 
                    id={`name-${team.id}`}
                    value={edits[team.id]?.name || ""}
                    onChange={(e) => handleEditChange(team.id, 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`short-${team.id}`}>Short Name (Scoreboard)</Label>
                  <Input 
                    id={`short-${team.id}`}
                    value={edits[team.id]?.shortName || ""}
                    onChange={(e) => handleEditChange(team.id, 'shortName', e.target.value)}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`color-${team.id}`}>Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      id={`color-${team.id}`}
                      type="color"
                      value={edits[team.id]?.primaryColor || "#000000"}
                      onChange={(e) => handleEditChange(team.id, 'primaryColor', e.target.value)}
                      className="w-16 p-1 h-10"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => handleSave(team.id)}
                  disabled={updateMutation.isPending && updateMutation.variables?.id === team.id}
                  className="w-full md:w-auto"
                >
                  {(updateMutation.isPending && updateMutation.variables?.id === team.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
