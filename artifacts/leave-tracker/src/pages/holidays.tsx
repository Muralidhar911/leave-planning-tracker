import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  PartyPopper, Flag, Globe, Calendar, Filter, X,
  ChevronDown, ChevronUp, MapPin, Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  sortedHolidays,
  LOCATIONS,
  type Holiday,
  type HolidayCategory,
  type Location,
} from "@/data/holidays";

// ─── Constants ──────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CATEGORY_CONFIG: Record<HolidayCategory, {
  label: string;
  color: string;
  bg: string;
  icon: React.FC<{ className?: string }>;
  glow: string;
}> = {
  national: {
    label: "National",
    color: "text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/30",
    icon: Globe,
    glow: "rgba(249,115,22,0.3)",
  },
  state: {
    label: "State",
    color: "text-blue-400",
    bg: "bg-blue-500/15 border-blue-500/30",
    icon: Landmark,
    glow: "rgba(59,130,246,0.3)",
  },
  weekend: {
    label: "Weekend",
    color: "text-rose-400",
    bg: "bg-rose-500/15 border-rose-500/30",
    icon: Calendar,
    glow: "rgba(244,63,94,0.3)",
  },
};

// ─── Helper components ───────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: HolidayCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", cfg.bg, cfg.color)}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function LocationBadge({ loc }: { loc: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-muted-foreground border border-white/5">
      {loc}
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Holidays() {
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(MONTHS));

  const toggleGroup = (month: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  };

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterCategory("all");
    setFilterLocation("all");
  };

  const hasActiveFilters = filterMonth !== "all" || filterCategory !== "all" || filterLocation !== "all";

  // ─── Filter logic ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return sortedHolidays.filter((h) => {
      const month = format(parseISO(h.date), "MMMM");
      if (filterMonth !== "all" && month !== filterMonth) return false;
      if (filterCategory !== "all" && h.category !== filterCategory) return false;
      if (filterLocation !== "all") {
        const loc = filterLocation as Location;
        if (h.locations.length > 0 && !h.locations.includes(loc)) return false;
      }
      return true;
    });
  }, [filterMonth, filterCategory, filterLocation]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, Holiday[]>();
    for (const h of filtered) {
      const month = format(parseISO(h.date), "MMMM");
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(h);
    }
    return map;
  }, [filtered]);

  // Summary stats
  const stats = useMemo(() => ({
    total: filtered.length,
    national: filtered.filter((h) => h.category === "national").length,
    state: filtered.filter((h) => h.category === "state").length,
    weekend: filtered.filter((h) => h.category === "weekend").length,
  }), [filtered]);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <PartyPopper className="w-5 h-5 text-white" />
              </span>
              Holiday Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">DXC India Office Holidays 2026</p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1.5 bg-white/5">
            {stats.total} holidays {hasActiveFilters ? "(filtered)" : "this year"}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: Flag, color: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.35)" },
            { label: "National", value: stats.national, icon: Globe, color: "from-orange-500 to-amber-500", glow: "rgba(249,115,22,0.35)" },
            { label: "State-specific", value: stats.state, icon: Landmark, color: "from-blue-500 to-cyan-500", glow: "rgba(59,130,246,0.35)" },
            { label: "Weekend", value: stats.weekend, icon: Calendar, color: "from-rose-500 to-pink-500", glow: "rgba(244,63,94,0.35)" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="relative overflow-hidden border-white/5 bg-black/40 backdrop-blur-sm group">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} rounded-full blur-[40px] opacity-20 group-hover:opacity-35 transition-opacity`} />
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} flex-shrink-0`} style={{ boxShadow: `0 0 16px ${card.glow}` }}>
                    <card.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-display font-bold text-foreground">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="glass-panel p-4 rounded-2xl">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Month</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="national">National</SelectItem>
                  <SelectItem value="state">State-specific</SelectItem>
                  <SelectItem value="weekend">Weekend (falls on weekend)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Office Location
              </label>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground gap-1.5 shrink-0">
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => setFilterCategory(filterCategory === key ? "all" : key)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  filterCategory === key ? cfg.bg + " " + cfg.color : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cfg.label} Holidays
              </button>
            );
          })}
        </div>

        {/* Holiday List — grouped by month */}
        {grouped.size === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium text-lg">No holidays found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([month, holidays], groupIdx) => (
              <motion.div
                key={month}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.06 }}
              >
                <Card className="border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
                  {/* Month header */}
                  <button
                    onClick={() => toggleGroup(month)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-white/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-accent">
                          {month.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-display font-semibold text-foreground">{month} 2026</p>
                        <p className="text-xs text-muted-foreground">{holidays.length} holiday{holidays.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        {(["national", "state", "weekend"] as HolidayCategory[]).map((cat) => {
                          const count = holidays.filter((h) => h.category === cat).length;
                          if (!count) return null;
                          const cfg = CATEGORY_CONFIG[cat];
                          return (
                            <span key={cat} className={cn("text-[10px] px-1.5 py-0.5 rounded border font-semibold", cfg.bg, cfg.color)}>
                              {count}
                            </span>
                          );
                        })}
                      </div>
                      {expandedGroups.has(month)
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                  </button>

                  {/* Holiday rows */}
                  <AnimatePresence initial={false}>
                    {expandedGroups.has(month) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/5">
                          <table className="w-full text-sm">
                            <thead className="bg-white/[0.03] border-b border-white/5">
                              <tr>
                                <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider">Date</th>
                                <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider">Day</th>
                                <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider">Holiday</th>
                                <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider">Category</th>
                                <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider">Applicable Offices</th>
                              </tr>
                            </thead>
                            <tbody>
                              {holidays.map((h, i) => {
                                const cfg = CATEGORY_CONFIG[h.category];
                                const isWeekend = h.day === "Saturday" || h.day === "Sunday";
                                return (
                                  <motion.tr
                                    key={h.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className={cn(
                                      "border-b border-white/5 last:border-b-0 transition-colors hover:bg-white/[0.02]",
                                      h.category === "weekend" && "bg-rose-500/[0.03]"
                                    )}
                                  >
                                    {/* Date */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className={cn("inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-semibold", cfg.bg, cfg.color)}>
                                        {format(parseISO(h.date), "dd MMM")}
                                      </div>
                                    </td>

                                    {/* Day */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className={cn("text-sm", isWeekend ? "text-rose-400 font-semibold" : "text-muted-foreground")}>
                                        {h.day}
                                      </span>
                                    </td>

                                    {/* Name */}
                                    <td className="px-4 py-3">
                                      <span className="font-medium text-foreground">{h.name}</span>
                                    </td>

                                    {/* Category */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <CategoryBadge category={h.category} />
                                    </td>

                                    {/* Locations */}
                                    <td className="px-4 py-3">
                                      {h.locations.length === 0 ? (
                                        <span className="text-xs text-muted-foreground italic">—</span>
                                      ) : h.locations.length === LOCATIONS.length ? (
                                        <span className="text-xs text-emerald-400 font-semibold">All Offices</span>
                                      ) : (
                                        <div className="flex flex-wrap gap-1">
                                          {h.locations.map((loc) => (
                                            <LocationBadge key={loc} loc={loc} />
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer note */}
        {!hasActiveFilters && (
          <p className="text-center text-xs text-muted-foreground pb-4">
            Published 17th December 2025 · Grand Total: 10 working holidays per office location
          </p>
        )}
      </div>
    </AppLayout>
  );
}
