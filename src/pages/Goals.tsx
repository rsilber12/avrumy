import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    // If checking and no date set, set today's date
    const newDate = newChecked && !goal.target_date 
      ? format(new Date(), "yyyy-MM-dd") 
      : goal.target_date;
    
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, checked: newChecked, target_date: newDate } : g))
    );

    await supabase.from("goals").update({ checked: newChecked, target_date: newDate }).eq("id", goalId);
  };

  const setGoalDate = async (goalId: number, date: Date | undefined) => {
    const dateStr = date ? format(date, "yyyy-MM-dd") : null;
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, target_date: dateStr } : g))
    );

    await supabase.from("goals").update({ target_date: dateStr }).eq("id", goalId);
  };

  const completedCount = goals.filter((g) => g.checked).length;
  const progressPercent = Math.round((completedCount / 500) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header with centered logo */}
        <div className="flex justify-center py-4">
          <img
            src="/favicon.png"
            alt="Logo"
            className="w-10 h-10"
          />
        </div>

        {/* Progress Section */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Goals Achieved</h2>
              <div className="text-right">
                <span className="text-3xl md:text-4xl font-bold text-primary">{progressPercent}%</span>
                <span className="text-muted-foreground ml-2">({completedCount}/500)</span>
              </div>
            </div>
            
            {/* Progress bar with markers */}
            <div className="relative">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 md:p-6">
            <Textarea
              placeholder="Write your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] resize-none bg-transparent border-none p-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
            />
          </CardContent>
        </Card>

        {/* Goals Grid */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 px-4 md:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Your Goals</CardTitle>
              <span className="text-sm text-muted-foreground">Click to check/uncheck</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
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

  const displayDate = validDate ? format(validDate, "MM/dd") : "--/--";

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
            "relative aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all border-2",
            goal.checked
              ? "bg-primary/20 border-primary/50 text-primary"
              : "bg-muted/50 border-muted-foreground/20 text-muted-foreground"
          )}
        >
          {/* Checkbox icon */}
          <div className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all",
            goal.checked
              ? "bg-primary border-primary"
              : "bg-transparent border-muted-foreground/40"
          )}>
            {goal.checked && <Check className="w-4 h-4 text-primary-foreground" />}
          </div>
          
          {/* Date display */}
          <span className="text-[10px] font-medium">{displayDate}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
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
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};

export default Goals;
