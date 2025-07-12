import { useState, useEffect } from "react";
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

// Function to generate sample data
const generateSampleData = (startWeight, daysBack = 90) => {
  const data = [];
  const today = new Date();
  let currentWeight = startWeight;

  for (let i = daysBack; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Add some random variation to the weight progression
    const randomProgress = Math.random() * 2.5 - 0.5; // Random number between -0.5 and 2
    currentWeight += randomProgress;

    // Occasionally add a bigger jump or drop to simulate good/bad days
    if (Math.random() < 0.1) {
      // 10% chance
      currentWeight += Math.random() * 5 - 2.5;
    }

    data.push({
      date: date.toISOString(),
      weight: Math.round(currentWeight),
    });
  }

  return {
    base_lift_id: "sample",
    rep_range_progress: {
      rep_ranges: {
        5: {
          history: data.map((entry) => ({
            date: entry.date,
            weight: entry.weight,
          })),
        },
        8: {
          history: data.map((entry) => ({
            date: entry.date,
            weight: Math.round(entry.weight * 0.9), // 90% of 5-rep weight
          })),
        },
        12: {
          history: data.map((entry) => ({
            date: entry.date,
            weight: Math.round(entry.weight * 0.8), // 80% of 5-rep weight
          })),
        },
      },
    },
  };
};

const LiftsData = ({ lift }) => {
  const [progressData, setProgressData] = useState(null);
  const [selectedReps, setSelectedReps] = useState(null);

  useEffect(() => {
    // Comment out the API call temporarily and use sample data instead
    // const fetchLiftData = async () => {
    //   try {
    //     const liftsData = await getUserLiftsData();
    //     const currentLiftData = liftsData.find(
    //       (data) => String(data.base_lift_id) === String(lift.id)
    //     );
    //     setProgressData(currentLiftData);
    //
    //     if (currentLiftData?.rep_range_progress?.rep_ranges) {
    //       const firstRange = Object.keys(
    //         currentLiftData.rep_range_progress.rep_ranges
    //       )[0];
    //       setSelectedReps(firstRange);
    //     }
    //   } catch (error) {
    //     console.error("Error fetching lift data:", error);
    //   }
    // };

    // Use sample data instead
    const sampleData = generateSampleData(135); // Start at 135 lbs
    setProgressData(sampleData);
    setSelectedReps("5"); // Default to 5 reps

    // fetchLiftData();
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
                    tick={{
                      stroke: "var(--text-secondary)",
                      dy: 10,
                    }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                      });
                    }}
                    interval="preserveStart"
                    minTickGap={200}
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
                    domain={["dataMin", "auto"]}
                    ticks={(() => {
                      const data = getProgressChartData();
                      if (!data.length) return [];
                      const min =
                        Math.floor(Math.min(...data.map((d) => d.actual)) / 5) *
                        5;
                      // Consider both actual and estimated for max value
                      const maxActual = Math.max(...data.map((d) => d.actual));
                      const maxEstimated = Math.max(
                        ...data.map((d) => d.estimated)
                      );
                      const max =
                        Math.ceil(Math.max(maxActual, maxEstimated) / 5) * 5;
                      const count = 8; // Number of ticks we want
                      const step = Math.ceil((max - min) / (count - 1) / 5) * 5;
                      const ticks = [];
                      for (let i = min; i <= max; i += step) {
                        ticks.push(i);
                      }
                      return ticks;
                    })()}
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
