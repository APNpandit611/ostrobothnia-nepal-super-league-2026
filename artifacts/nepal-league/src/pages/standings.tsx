import { useGetStandings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Standings() {
  const { data: standings, isLoading } = useGetStandings();

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
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Standings</h1>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center font-bold">#</TableHead>
                <TableHead className="font-bold uppercase tracking-wider">Team</TableHead>
                <TableHead className="text-center font-bold" title="Played">P</TableHead>
                <TableHead className="text-center font-bold" title="Won">W</TableHead>
                <TableHead className="text-center font-bold" title="Drawn">D</TableHead>
                <TableHead className="text-center font-bold" title="Lost">L</TableHead>
                <TableHead className="text-center font-bold hidden md:table-cell" title="Goals For">GF</TableHead>
                <TableHead className="text-center font-bold hidden md:table-cell" title="Goals Against">GA</TableHead>
                <TableHead className="text-center font-bold" title="Goal Difference">GD</TableHead>
                <TableHead className="text-center font-bold text-primary">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings?.map((row, idx) => (
                <TableRow 
                  key={row.teamId}
                  className={cn(
                    "transition-colors",
                    idx === 0 ? "bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary" : ""
                  )}
                >
                  <TableCell className="text-center font-mono font-bold">
                    {idx === 0 ? <Trophy className="h-4 w-4 mx-auto text-primary" /> : row.position}
                  </TableCell>
                  <TableCell className="font-bold">
                    {row.teamName}
                  </TableCell>
                  <TableCell className="text-center">{row.played}</TableCell>
                  <TableCell className="text-center">{row.won}</TableCell>
                  <TableCell className="text-center">{row.drawn}</TableCell>
                  <TableCell className="text-center">{row.lost}</TableCell>
                  <TableCell className="text-center hidden md:table-cell text-muted-foreground">{row.goalsFor}</TableCell>
                  <TableCell className="text-center hidden md:table-cell text-muted-foreground">{row.goalsAgainst}</TableCell>
                  <TableCell className="text-center font-mono">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</TableCell>
                  <TableCell className="text-center font-bold text-lg text-primary">{row.points}</TableCell>
                </TableRow>
              ))}
              {(!standings || standings.length === 0) && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Standings not available yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex gap-4 text-xs text-muted-foreground mt-4 flex-wrap">
        <span><strong className="text-foreground">P</strong>: Played</span>
        <span><strong className="text-foreground">W</strong>: Won</span>
        <span><strong className="text-foreground">D</strong>: Drawn</span>
        <span><strong className="text-foreground">L</strong>: Lost</span>
        <span className="hidden md:inline"><strong className="text-foreground">GF</strong>: Goals For</span>
        <span className="hidden md:inline"><strong className="text-foreground">GA</strong>: Goals Against</span>
        <span><strong className="text-foreground">GD</strong>: Goal Difference</span>
        <span><strong className="text-foreground">Pts</strong>: Points</span>
      </div>
    </div>
  );
}
