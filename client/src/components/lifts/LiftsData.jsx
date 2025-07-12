import { useState, useEffect } from "react";
import { getUserLiftsData } from "@/services/user";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const LiftsData = ({ lift }) => {
  const [progressData, setProgressData] = useState(null);
  const [selectedReps, setSelectedReps] = useState(null);

  useEffect(() => {
    const fetchLiftData = async () => {
      try {
        const liftsData = await getUserLiftsData();
        const currentLiftData = liftsData.find(
          (data) => String(data.base_lift_id) === String(lift.id)
        );
        setProgressData(currentLiftData);

        // Set initial selected reps to the first available rep range
        if (currentLiftData?.rep_range_progress?.rep_ranges) {
          const firstRange = Object.keys(
            currentLiftData.rep_range_progress.rep_ranges
          )[0];
          setSelectedReps(firstRange);
        }
      } catch (error) {
        console.error("Error fetching lift data:", error);
      }
    };

    fetchLiftData();
  }, [lift.id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getProgressChartData = () => {
    if (!progressData?.rep_range_progress?.rep_ranges || !selectedReps) {
      return [];
    }

    const repRange = progressData.rep_range_progress.rep_ranges[selectedReps];
    if (!repRange?.history?.length) {
      return [];
    }

    return repRange.history
      .map((entry) => ({
        date: entry.date,
        actual: entry.weight,
        estimated: entry.weight + 10, // Static 10lbs above actual
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getChartConfig = () => {
    return {
      actual: {
        label: "Actual Weight",
        color: "hsl(var(--chart-1))",
      },
      estimated: {
        label: "Estimated Weight",
        color: "hsl(var(--chart-2))",
      },
    };
  };

  const availableReps = progressData?.rep_range_progress?.rep_ranges
    ? Object.keys(progressData.rep_range_progress.rep_ranges)
    : [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4 bg-[var(--surface)] shadow-md border border-[var(--border)]">
        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Progress Over Time
          </h3>

          <ToggleGroup
            type="single"
            value={selectedReps}
            onValueChange={(value) => value && setSelectedReps(value)}
            className="justify-start rounded-lg p-1 bg-[var(--background)] text-[var(--text-secondary)]"
          >
            {availableReps.map((reps) => (
              <ToggleGroupItem
                key={reps}
                value={reps}
                className="flex-1 data-[state=on]:bg-[var(--primary)] data-[state=on]:text-white hover:bg-[var(--primary-hover)] transition-colors"
              >
                {reps} Reps
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="w-full h-[400px] bg-[var(--background)] rounded-lg mt-4 p-4">
          {progressData && selectedReps ? (
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer config={getChartConfig()}>
                <LineChart data={getProgressChartData()}>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--text-secondary)"
                    strokeOpacity={0.1}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatDate}
                    tick={{
                      stroke: "var(--text-secondary)",
                      dy: 10,
                    }}
                  />
                  <YAxis
                    dataKey="actual"
                    tick={{
                      stroke: "var(--text-secondary)",
                      dx: -10,
                      textAnchor: "end",
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                    domain={["dataMin - 10", "dataMax + 10"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Weight"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="estimated"
                    name="Estimated Weight"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => (
                      <ChartTooltipContent
                        active={active}
                        payload={payload}
                        label={label}
                        labelFormatter={formatDate}
                        fill="var(--text-primary)"
                        className="text-[var(--text-secondary)]"
                      />
                    )}
                  />
                </LineChart>
              </ChartContainer>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-[var(--text-secondary)]">
                {!progressData ? "Loading data..." : "Select a rep range"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg p-4 bg-[var(--surface)] shadow-md border border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Volume Breakdown
        </h3>
        <div className="w-full h-[400px] bg-[var(--background)] flex items-center justify-center rounded-lg mt-2">
          <span className="text-[var(--text-secondary)]">
            Graph placeholder for {lift.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiftsData;
