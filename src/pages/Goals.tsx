import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";

interface Goal {
  id: number;
  checked: boolean;
  target_date: string | null;
}

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch goals and notes on mount
  useEffect(() => {
    const fetchData = async () => {
      const [goalsRes, notesRes] = await Promise.all([
        supabase.from("goals").select("*").order("id"),
        supabase.from("notes").select("*").eq("id", 1).maybeSingle(),
      ]);

      if (goalsRes.data) {
        setGoals(goalsRes.data);
      }
      if (notesRes.data) {
        setNotes(notesRes.data.content || "");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Debounced notes save
  useEffect(() => {
    if (loading) return;
    
    const timeout = setTimeout(async () => {
      await supabase.from("notes").update({ content: notes }).eq("id", 1);
    }, 500);

    return () => clearTimeout(timeout);
  }, [notes, loading]);

  const toggleGoal = async (goalId: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newChecked = !goal.checked;
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, checked: newChecked } : g))
    );

    await supabase.from("goals").update({ checked: newChecked }).eq("id", goalId);
  };

  const setGoalDate = async (goalId: number, date: Date | undefined) => {
    const dateStr = date ? format(date, "yyyy-MM-dd") : null;
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, target_date: dateStr } : g))
    );

    await supabase.from("goals").update({ target_date: dateStr }).eq("id", goalId);
  };

  const completedCount = goals.filter((g) => g.checked).length;
  const progressPercent = (completedCount / 500) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 py-6">
          <img
            src="/favicon.png"
            alt="Logo"
            className="w-6 h-6"
          />
          <h1 className="text-3xl font-bold">
            2026 <span className="text-primary">Goals</span>
          </h1>
        </div>

        {/* Progress Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Progress</span>
              <span className="text-sm font-normal text-muted-foreground">
                {completedCount}/500 Goals
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercent} className="h-3" />
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Write your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Goals Grid */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 lg:grid-cols-25 gap-1">
              {goals.map((goal) => (
                <GoalBox
                  key={goal.id}
                  goal={goal}
                  onToggle={toggleGoal}
                  onDateChange={setGoalDate}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface GoalBoxProps {
  goal: Goal;
  onToggle: (id: number) => void;
  onDateChange: (id: number, date: Date | undefined) => void;
}

const GoalBox = ({ goal, onToggle, onDateChange }: GoalBoxProps) => {
  const [open, setOpen] = useState(false);

  const parsedDate = goal.target_date
    ? parse(goal.target_date, "yyyy-MM-dd", new Date())
    : undefined;
  const validDate = parsedDate && isValid(parsedDate) ? parsedDate : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => {
            if (!open) {
              onToggle(goal.id);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          className={cn(
            "relative aspect-square rounded-md text-[10px] font-medium flex flex-col items-center justify-center gap-0.5 transition-all",
            "hover:ring-2 hover:ring-primary/50",
            goal.checked
              ? "bg-green-600 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {goal.checked ? (
            <Check className="w-3 h-3" />
          ) : (
            <span>{goal.id}</span>
          )}
          {goal.target_date && (
            <span className="text-[7px] opacity-75">
              {format(validDate!, "M/d")}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2 border-b">
          <span className="text-sm font-medium">Goal #{goal.id}</span>
        </div>
        <Calendar
          mode="single"
          selected={validDate}
          onSelect={(date) => {
            onDateChange(goal.id, date);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default Goals;
