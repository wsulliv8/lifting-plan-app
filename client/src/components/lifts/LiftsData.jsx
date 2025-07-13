import { useState, useEffect } from "react";
import { getUserLiftsData } from "@/services/user";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from "recharts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const generateSampleMonthlyData = () => {
  const months = 6; // Generate 6 months of data
  const data = {};

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format

    // Generate somewhat realistic data with an upward trend
    const baseValue = 10; // Base value for sets
    const trendFactor = 1 + i / months; // Creates an upward trend as we go back in time

    data[monthKey] = {
      sets: Math.round(baseValue * trendFactor * (0.8 + Math.random() * 0.4)), // 8-12 sets with variation
      reps: Math.round(
        baseValue * 8 * trendFactor * (0.8 + Math.random() * 0.4)
      ), // ~80-100 reps
      volume: Math.round(
        baseValue * 8 * 225 * trendFactor * (0.8 + Math.random() * 0.4)
      ), // Volume based on reps * 225lbs
    };
  }

  return data;
};

const StatsBlock = ({ totalVolume, percentile }) => {
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await fetch(
          `/api/weight-comparison?weight=${totalVolume}`
        );
        const data = await response.json();
        setComparison(data);
      } catch (error) {
        console.error("Error fetching weight comparison:", error);
        setComparison({
          name: "Loading...",
          fun_fact: "Loading comparison...",
          image_url: null,
        });
      }
    };

    fetchComparison();
  }, [totalVolume]);

  const chartData = [{ percentile }];

  return (
    <div className="grid grid-cols-2 gap-4 my-4">
      <Card className="p-4 flex items-center space-x-4 border-2 border-[var(--primary)]">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--primary)]">
            Total Volume
          </h3>
          <p className="text-5xl font-bold text-[var(--secondary)]">
            {totalVolume.toLocaleString()} lbs
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {comparison?.fun_fact}
          </p>
        </div>
        <div className="w-24 h-24 bg-[var(--background)] rounded-lg flex items-center justify-center">
          {comparison?.image_url ? (
            <img
              src={comparison.image_url}
              alt={comparison.name}
              className="w-20 h-20 object-contain"
            />
          ) : (
            <span className="text-[var(--text-secondary)]">Loading...</span>
          )}
        </div>
      </Card>

      <Card className="p-4 border-2 border-[var(--primary)]">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Strength Percentile
          </h3>
          <div className="w-full aspect-square max-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer
                config={{
                  percentile: {
                    label: "Percentile",
                    color: "hsl(var(--chart-2))",
                  },
                }}
              >
                <RadialBarChart
                  data={chartData}
                  startAngle={0}
                  endAngle={(percentile / 100) * 360}
                  innerRadius={80}
                  outerRadius={110}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    className="first:fill-[var(--border)] last:fill-[var(--background)]"
                    polarRadius={[86, 74]}
                  />
                  <RadialBar
                    dataKey="percentile"
                    background
                    fill="hsl(var(--chart-2))"
                    backgroundFill="var(--border)"
                    cornerRadius={10}
                  />
                  <PolarRadiusAxis
                    tick={false}
                    tickLine={false}
                    axisLine={false}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-[var(--text-primary)] text-4xl font-bold"
                              >
                                {percentile}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-[var(--text-secondary)]"
                              >
                                stronger than average
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-2 text-sm mt-2">
            <TrendingUp className="h-4 w-4 text-[var(--text-secondary)]" />
            <span className="text-[var(--text-secondary)]">
              Based on population data
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

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

        // If no monthly_volume data exists, add sample data
        if (
          currentLiftData &&
          !currentLiftData.rep_range_progress?.monthly_volume
        ) {
          currentLiftData.rep_range_progress = {
            ...currentLiftData.rep_range_progress,
            monthly_volume: generateSampleMonthlyData(),
          };
        }

        setProgressData(currentLiftData);

        if (currentLiftData?.rep_range_progress?.rep_ranges) {
          const firstRange = Object.keys(
            currentLiftData.rep_range_progress.rep_ranges
          )[0];
          setSelectedReps(firstRange);
        }
      } catch (error) {
        console.error("Error fetching lift data:", error);
        // Use sample data if fetch fails
        setProgressData({
          rep_range_progress: {
            monthly_volume: generateSampleMonthlyData(),
          },
        });
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
        estimated: entry.estimated_max,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Calculate consistent Y-axis domain across all rep ranges
  const getYAxisDomain = () => {
    if (!progressData?.rep_range_progress?.rep_ranges) {
      return { min: 0, max: 100 };
    }

    // Get all weights and estimated maxes across all rep ranges
    const allValues = Object.values(
      progressData.rep_range_progress.rep_ranges
    ).flatMap((range) =>
      range.history.flatMap((entry) => [entry.weight, entry.estimated_max])
    );

    if (!allValues.length) return { min: 0, max: 100 };

    // Find global min and max
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    // Round min down and max up to nearest 5
    const min = Math.floor(minValue / 5) * 5;
    const max = Math.ceil(maxValue / 5) * 5;

    return { min, max };
  };

  const getChartConfig = (type = "progress") => {
    if (type === "volume") {
      return {
        sets: {
          label: "Sets",
          color: "hsl(var(--chart-1))",
        },
        reps: {
          label: "Total Reps",
          color: "hsl(var(--chart-3))",
        },
        volume: {
          label: "Volume (lbs)",
          color: "hsl(var(--chart-5))",
        },
      };
    }

    return {
      actual: {
        label: "Achieved",
        color: "hsl(var(--chart-1))",
      },
      estimated: {
        label: "Estimated",
        color: "hsl(var(--chart-4))",
      },
    };
  };

  const getScaledVolumeData = (monthlyVolume) => {
    const monthlyData = Object.entries(monthlyVolume);

    // Calculate averages
    const avgSets =
      monthlyData.reduce((sum, [, data]) => sum + data.sets, 0) /
      monthlyData.length;
    const avgReps =
      monthlyData.reduce((sum, [, data]) => sum + data.reps, 0) /
      monthlyData.length;
    const avgVolume =
      monthlyData.reduce((sum, [, data]) => sum + data.volume, 0) /
      monthlyData.length;

    // Use the largest average as the base scale
    const baseScale = Math.max(avgSets, avgReps, avgVolume);

    // Create scale factors to normalize each metric relative to the largest
    const setScale = baseScale / avgSets;
    const repScale = baseScale / avgReps;
    const volumeScale = baseScale / avgVolume;

    return monthlyData
      .map(([month, data]) => ({
        month,
        sets: data.sets,
        scaledSets: data.sets * setScale, // Scale sets relative to largest metric
        reps: data.reps,
        scaledReps: data.reps * repScale, // Scale reps relative to largest metric
        volume: data.volume,
        scaledVolume: data.volume * volumeScale, // Scale volume relative to largest metric
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculateTotalVolume = () => {
    if (!progressData?.rep_range_progress?.monthly_volume) return 0;
    return Object.values(progressData.rep_range_progress.monthly_volume).reduce(
      (total, month) => total + month.volume,
      0
    );
  };

  const calculatePercentile = () => {
    // This would use your population statistics data
    return 85; // Placeholder
  };

  const { min: yMin, max: yMax } = getYAxisDomain();
  const yRange = yMax - yMin;
  const yStep = Math.max(5, Math.ceil(yRange / 8 / 5) * 5); // At least 5, rounded up to nearest 5
  const yTicks = Array.from(
    { length: Math.floor(yRange / yStep) + 1 },
    (_, i) => yMin + yStep * i
  );

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
                    domain={[yMin, yMax]}
                    ticks={yTicks}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Achieved"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="estimated"
                    name="Estimated"
                    stroke="hsl(var(--chart-4))"
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

      <StatsBlock
        totalVolume={calculateTotalVolume()}
        percentile={calculatePercentile()}
      />

      <div className="rounded-lg p-4 bg-[var(--surface)] shadow-md border border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Volume Breakdown
        </h3>
        <div className="w-full h-[400px] bg-[var(--background)] rounded-lg mt-2 p-4">
          {progressData?.rep_range_progress?.monthly_volume ? (
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer config={getChartConfig("volume")}>
                <BarChart
                  data={getScaledVolumeData(
                    progressData.rep_range_progress.monthly_volume
                  )}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--text-secondary)"
                    strokeOpacity={0.1}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      stroke: "var(--text-secondary)",
                      dy: 10,
                    }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const [year, month] = value.split("-");
                      return new Date(year, month - 1).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          year: "2-digit",
                        }
                      );
                    }}
                    interval="preserveStart"
                    minTickGap={40}
                  />
                  <ChartLegend
                    content={
                      <ChartLegendContent
                        nameKey={(item) =>
                          item.dataKey.replace("scaled", "").toLowerCase()
                        }
                      />
                    }
                    verticalAlign="top"
                    height={36}
                    className="text-[var(--text-secondary)]"
                  />
                  <Bar
                    dataKey="scaledSets"
                    name="Sets"
                    fill="hsl(var(--chart-1))"
                  >
                    <LabelList
                      dataKey="sets"
                      position="top"
                      fill="var(--text-secondary)"
                    />
                  </Bar>
                  <Bar
                    dataKey="scaledReps"
                    name="Total Reps"
                    fill="hsl(var(--chart-3))"
                  >
                    <LabelList
                      dataKey="reps"
                      position="top"
                      fill="var(--text-secondary)"
                    />
                  </Bar>
                  <Bar
                    dataKey="scaledVolume"
                    name="Volume (lbs)"
                    fill="hsl(var(--chart-5))"
                  >
                    <LabelList
                      dataKey="volume"
                      position="top"
                      fill="var(--text-secondary)"
                      formatter={(value) => Math.round(value / 100)}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-[var(--text-secondary)]">
                No volume data available
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiftsData;
