import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Globe, Mail, Users } from "lucide-react";

const AnalyticsAdmin = () => {
  const { data: totalVisits } = useQuery({
    queryKey: ["analytics-total-visits"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("page_visits")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: todayVisits } = useQuery({
    queryKey: ["analytics-today-visits"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from("page_visits")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: countryData } = useQuery({
    queryKey: ["analytics-countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_visits")
        .select("country")
        .not("country", "is", null);
      
      if (error) throw error;
      
      // Count by country
      const counts: Record<string, number> = {};
      data?.forEach((visit) => {
        if (visit.country) {
          counts[visit.country] = (counts[visit.country] || 0) + 1;
        }
      });
      
      return Object.entries(counts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });

  const { data: pageData } = useQuery({
    queryKey: ["analytics-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_visits")
        .select("page_path");
      
      if (error) throw error;
      
      // Count by page
      const counts: Record<string, number> = {};
      data?.forEach((visit) => {
        counts[visit.page_path] = (counts[visit.page_path] || 0) + 1;
      });
      
      return Object.entries(counts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  const { data: emailClicks } = useQuery({
    queryKey: ["analytics-email-clicks"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("email_clicks")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisits ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayVisits ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countryData?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Clicks</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailClicks ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Countries */}
      <Card>
        <CardHeader>
          <CardTitle>Visitors by Country</CardTitle>
          <CardDescription>Top 10 countries</CardDescription>
        </CardHeader>
        <CardContent>
          {countryData && countryData.length > 0 ? (
            <div className="space-y-3">
              {countryData.map((item) => (
                <div key={item.country} className="flex items-center justify-between">
                  <span className="text-sm">{item.country}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 bg-primary rounded-full" 
                      style={{ 
                        width: `${Math.max(20, (item.count / (countryData[0]?.count || 1)) * 100)}px` 
                      }} 
                    />
                    <span className="text-sm text-muted-foreground w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Page Views</CardTitle>
          <CardDescription>Views by page</CardDescription>
        </CardHeader>
        <CardContent>
          {pageData && pageData.length > 0 ? (
            <div className="space-y-3">
              {pageData.map((item) => (
                <div key={item.page} className="flex items-center justify-between">
                  <span className="text-sm font-mono">{item.page}</span>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsAdmin;
