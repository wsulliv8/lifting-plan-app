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

const LiftsData = ({ lift }) => {
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    const fetchLiftData = async () => {
      try {
        console.log("Fetching data for lift:", {
          id: lift.id,
          type: typeof lift.id,
          lift,
        });
        const liftsData = await getUserLiftsData();
        console.log("All lifts data:", liftsData);

        // Log each comparison attempt
        liftsData.forEach((data) => {
          console.log("Comparing:", {
            dataId: data.base_lift_id,
            dataIdType: typeof data.base_lift_id,
            liftId: lift.id,
            liftIdType: typeof lift.id,
            isMatch: String(data.base_lift_id) === String(lift.id),
          });
        });

        const currentLiftData = liftsData.find(
          (data) => String(data.base_lift_id) === String(lift.id)
        );
        console.log("Found lift data:", currentLiftData);
        setProgressData(currentLiftData);
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
    if (!progressData?.rep_range_progress?.rep_ranges) {
      console.log("No progress data available:", progressData);
      return [];
    }

    console.log("Progress data:", progressData.rep_range_progress.rep_ranges);

    // Convert the rep ranges data into a format suitable for the chart
    const repRanges = progressData.rep_range_progress.rep_ranges;
    const allDates = new Set();
    const repRangeData = {};

    // Check if repRanges is an object and has entries
    if (typeof repRanges !== "object" || !repRanges) {
      console.log("Invalid rep ranges data:", repRanges);
      return [];
    }

    // Collect all unique dates and initialize data structure
    Object.entries(repRanges).forEach(([reps, data]) => {
      if (!data?.history?.length) {
        console.log(`No history for rep range ${reps}:`, data);
        return;
      }

      data.history.forEach((entry) => {
        allDates.add(entry.date);
        if (!repRangeData[entry.date]) {
          repRangeData[entry.date] = { date: entry.date };
        }
        repRangeData[entry.date][`${reps}reps`] = entry.weight;
      });
    });

    // Convert to array and sort by date
    return Object.values(repRangeData).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  };

  const getChartConfig = () => {
    if (!progressData?.rep_range_progress?.rep_ranges) {
      return {};
    }

    const colors = [
      "#2563eb", // blue-600
      "#16a34a", // green-600
      "#dc2626", // red-600
      "#9333ea", // purple-600
      "#ea580c", // orange-600
    ];

    // Check if repRanges is an object and has entries
    const repRanges = progressData.rep_range_progress.rep_ranges;
    if (typeof repRanges !== "object" || !repRanges) {
      return {};
    }

    return Object.keys(repRanges).reduce(
      (config, reps, index) => ({
        ...config,
        [`${reps}reps`]: {
          label: `${reps} Reps`,
          color: colors[index % colors.length],
        },
      }),
      {}
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4 bg-[var(--surface)] shadow-md border border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Progress Over Time
        </h3>
        <div className="w-full h-[400px] bg-[var(--background)] rounded-lg mt-2">
          {progressData ? (
            <ChartContainer
              config={getChartConfig()}
              className="w-full [&_.recharts-cartesian-grid-horizontal_line]:stroke-border [&_.recharts-cartesian-grid-vertical_line]:stroke-border [&_.recharts-cartesian-axis-line]:stroke-border"
            >
              <LineChart data={getProgressChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="var(--text-primary)"
                />
                <YAxis
                  stroke="var(--text-primary)"
                  label={{
                    value: "Weight (lbs)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "var(--text-primary)" },
                  }}
                />
                {progressData.rep_range_progress?.rep_ranges &&
                  Object.keys(progressData.rep_range_progress.rep_ranges).map(
                    (reps) => (
                      <Line
                        key={reps}
                        type="monotone"
                        dataKey={`${reps}reps`}
                        name={`${reps} Reps`}
                        stroke={`var(--color-${reps}reps)`}
                        strokeWidth={2}
                        dot={{
                          r: 4,
                          fill: `var(--color-${reps}reps)`,
                          strokeWidth: 0,
                        }}
                      />
                    )
                  )}
                <ChartTooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltipContent
                      active={active}
                      payload={payload}
                      label={label}
                      labelFormatter={formatDate}
                    />
                  )}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-[var(--text-secondary)]">
                Loading data...
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
