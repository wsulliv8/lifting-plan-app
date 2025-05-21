const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const liftData = require("./data/liftData");
const userLiftsData = require("./data/userLiftsData");

const prisma = new PrismaClient();

// Map day_of_week strings to integers (0-6 for Sunday-Saturday)
const dayOfWeekMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

async function seed() {
  try {
    // Clear existing data (safe for development)
    await prisma.workoutDay.deleteMany();
    await prisma.day.deleteMany();
    await prisma.week.deleteMany();
    await prisma.supersetLinks.deleteMany();
    await prisma.lifts.deleteMany();
    await prisma.workouts.deleteMany();
    await prisma.plans.deleteMany();
    await prisma.userLiftsData.deleteMany();
    await prisma.baseLifts.deleteMany();
    await prisma.users.deleteMany();

    // Create Users
    const user = await prisma.users.create({
      data: {
        email: "test@example.com",
        username: "testuser",
        password: await bcrypt.hash("password123", 10),
        experience: "intermediate",
        created_at: new Date(),
      },
    });

    // Create BaseLifts
    const baseLifts = await prisma.baseLifts.createMany({
      data: liftData.map((lift) => ({
        ...lift,
        name: lift.name.toLowerCase(),
      })),
      skipDuplicates: true,
    });

    // Fetch BaseLifts IDs
    const benchPress = await prisma.baseLifts.findFirst({
      where: { name: "bench press" },
    });
    const squat = await prisma.baseLifts.findFirst({
      where: { name: "squat" },
    });
    const tricepDips = await prisma.baseLifts.findFirst({
      where: { name: "tricep dips" },
    });

    // Fetch all BaseLifts
    const createdLifts = await prisma.baseLifts.findMany();

    // Map lift names to IDs
    const liftMap = new Map(
      createdLifts.map((lift) => [lift.name.toLowerCase(), lift.id])
    );

    // Create Plans
    const plans = await prisma.plans.createMany({
      data: [
        {
          name: "Strength Plan",
          user_id: null, // Generic plan
          categories: ["Strength", "Beginner"],
          description: "12-week strength program",
          duration_weeks: 12,
          difficulty: "Beginner",
          goal: "Strength",
          created_at: new Date(),
        },
        {
          name: "User Strength Plan",
          user_id: user.id, // User-specific plan
          categories: ["Strength", "Intermediate"],
          description: "Custom strength program",
          duration_weeks: 8,
          difficulty: "Intermediate",
          goal: "Strength",
          created_at: new Date(),
        },
      ],
    });

    // Fetch Plans IDs
    const strengthPlan = await prisma.plans.findFirst({
      where: { name: "Strength Plan" },
    });
    const userPlan = await prisma.plans.findFirst({
      where: { name: "User Strength Plan" },
    });

    // Create Workouts
    const workouts = await prisma.workouts.createMany({
      data: [
        {
          user_id: null,
          plan_id: strengthPlan.id,
          name: "Push Day",
          week_number: 1,
          plan_day: 1,
          day_of_week: "Monday",
          iteration: 1,
          created_at: new Date(),
        },
        {
          user_id: user.id,
          plan_id: userPlan.id,
          name: "Pull Day",
          week_number: 1,
          plan_day: 2,
          day_of_week: "Wednesday",
          iteration: 1,
          created_at: new Date(),
        },
      ],
    });

    // Fetch Workouts IDs
    const pushDay = await prisma.workouts.findFirst({
      where: { name: "Push Day" },
    });
    const pullDay = await prisma.workouts.findFirst({
      where: { name: "Pull Day" },
    });

    // Create Weeks and Days for each Plan
    for (const plan of [strengthPlan, userPlan]) {
      // Create weeks based on duration_weeks
      for (
        let weekNumber = 1;
        weekNumber <= plan.duration_weeks;
        weekNumber++
      ) {
        const week = await prisma.week.create({
          data: {
            plan_id: plan.id,
            week_number: weekNumber,
          },
        });

        // Create days for each week (0-6 for Sunday-Saturday)
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
          await prisma.day.create({
            data: {
              week_id: week.id,
              day_of_week: dayOfWeek,
            },
          });
        }
      }
    }

    // Create WorkoutDay entries to link Workouts to Days
    const workoutsToLink = [
      { workout: pushDay, week_number: 1, day_of_week: "Monday", plan_day: 1 },
      {
        workout: pullDay,
        week_number: 1,
        day_of_week: "Wednesday",
        plan_day: 2,
      },
    ];

    for (const {
      workout,
      week_number,
      day_of_week,
      plan_day,
    } of workoutsToLink) {
      const dayOfWeekInt = dayOfWeekMap[day_of_week] || parseInt(day_of_week);
      const week = await prisma.week.findFirst({
        where: {
          plan_id: workout.plan_id,
          week_number: week_number,
        },
      });
      const day = await prisma.day.findFirst({
        where: {
          week_id: week.id,
          day_of_week: dayOfWeekInt,
        },
      });
      await prisma.workoutDay.create({
        data: {
          day_id: day.id,
          workout_id: workout.id,
          order: plan_day, // Use plan_day as the order
        },
      });
    }

    // Create Lifts
    const lifts = await prisma.lifts.createMany({
      data: [
        {
          workout_id: pushDay.id,
          base_lift_id: benchPress.id,
          name: "Bench Press",
          completed: true, // For progression testing
          sets: 3,
          reps: ["8-10", "8-10", "8-10"],
          reps_achieved: [8, 9, 10],
          weight: [135, 135, 135],
          weight_achieved: [135, 135, 135],
          rpe: ["8-10", "8-10", "8-10"],
          rpe_achieved: [8, 9, 9],
          rest_time: [90, 90, 90],
          volume: 3 * 9 * 135, // sets * avg reps * weight
          progression_rule: "Increase by 5 lbs if completed",
          created_at: new Date(),
        },
        {
          workout_id: pushDay.id,
          base_lift_id: tricepDips.id,
          name: "Tricep Dips",
          completed: false,
          sets: 3,
          reps: ["10-12", "10-12", "10-12"],
          reps_achieved: [10, 10, 8],
          weight: [0, 0, 0],
          weight_achieved: [0, 0, 0],
          rpe: ["7-9", "7-9", "7-9"],
          rpe_achieved: [7, 8, 8],
          rest_time: [60, 60, 60],
          volume: 3 * 10 * 0,
          created_at: new Date(),
        },
        {
          workout_id: pullDay.id,
          base_lift_id: squat.id,
          name: "Squat",
          completed: true,
          sets: 4,
          reps: ["5-7", "5-7", "5-7", "5-7"],
          reps_achieved: [6, 6, 5, 5],
          weight: [225, 225, 225, 225],
          weight_achieved: [225, 225, 225, 225],
          rpe: ["8-10", "8-10", "8-10", "8-10"],
          rpe_achieved: ["8-10"],
          rpe_achieved: [8, 9, 9, 10],
          rest_time: [120, 120, 120, 120],
          volume: 4 * 6 * 225,
          progression_rule: "Increase by 10 lbs if completed",
          created_at: new Date(),
        },
      ],
    });

    // Fetch Lifts IDs for SupersetLinks
    const benchPressLift = await prisma.lifts.findFirst({
      where: { workout_id: pushDay.id, base_lift_id: benchPress.id },
    });
    const tricepDipsLift = await prisma.lifts.findFirst({
      where: { workout_id: pushDay.id, base_lift_id: tricepDips.id },
    });

    // Create SupersetLinks
    await prisma.supersetLinks.create({
      data: {
        lift_id: benchPressLift.id,
        superset_lift_id: tricepDipsLift.id,
        created_at: new Date(),
      },
    });

    // Generate UserLiftsData
    const userLiftsDataEntries = userLiftsData
      .map((lift) => {
        const base_lift_id = liftMap.get(lift.name.toLowerCase());
        if (!base_lift_id) {
          console.warn(`Base lift not found for ${lift.name}`);
          return null;
        }

        // Calculate max_estimated (1RM = weight * (1 + reps/30))
        const max_estimated = lift.max_weights.map((weight, index) => {
          const reps = lift.rep_ranges[index];
          return Math.round(weight * (1 + reps / 30));
        });

        // Assume 3 sets for Main lifts, 2 for Supplementary (based on liftData.js)
        const isMainLift =
          liftData.find((l) => l.name.toLowerCase() === lift.name.toLowerCase())
            ?.lift_type === "Main";
        const set_counts = Array(lift.max_weights.length).fill(
          isMainLift ? 3 : 2
        );

        // Generate week_starts for 3 weeks (current and previous two)
        const week_starts = [
          new Date("2025-05-20"),
          new Date("2025-05-13"),
          new Date("2025-05-06"),
        ].slice(0, 3); // Limit to 3 weeks

        // Calculate weekly_reps (sets * reps) and weekly_volume (sets * reps * weight)
        const weekly_reps = lift.max_weights.map(
          (weight, index) => set_counts[index] * lift.rep_ranges[index]
        );
        const weekly_volume = lift.max_weights.map(
          (weight, index) => set_counts[index] * lift.rep_ranges[index] * weight
        );

        return {
          user_id: user.id,
          base_lift_id,
          max_weights: lift.max_weights,
          rep_ranges: lift.rep_ranges,
          max_estimated,
          set_counts,
          week_starts,
          weekly_reps,
          weekly_volume,
        };
      })
      .filter((entry) => entry !== null);

    // Create UserLiftsData
    await prisma.userLiftsData.createMany({
      data: userLiftsDataEntries,
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
