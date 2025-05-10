const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

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
        created_at: new Date(),
      },
    });

    // Create BaseLifts
    const baseLifts = await prisma.baseLifts.createMany({
      data: [
        {
          name: "Bench Press",
          description: "Compound chest exercise",
          muscle_group: "Chest",
          lift_type: "Main",
          equipment: "Barbell",
          created_at: new Date(),
        },
        {
          name: "Squat",
          description: "Compound leg exercise",
          muscle_group: "Quads",
          lift_type: "Main",
          equipment: "Barbell",
          created_at: new Date(),
        },
        {
          name: "Tricep Dips",
          description: "Triceps isolation exercise",
          muscle_group: "Triceps",
          lift_type: "Supplementary",
          equipment: "Bodyweight",
          created_at: new Date(),
        },
      ],
    });

    // Fetch BaseLifts IDs
    const benchPress = await prisma.baseLifts.findFirst({
      where: { name: "Bench Press" },
    });
    const squat = await prisma.baseLifts.findFirst({
      where: { name: "Squat" },
    });
    const tricepDips = await prisma.baseLifts.findFirst({
      where: { name: "Tricep Dips" },
    });

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

    // Create UserLiftsData
    await prisma.userLiftsData.createMany({
      data: [
        {
          user_id: user.id,
          base_lift_id: benchPress.id,
          max_weights: [135, 145], // For rep ranges 8-10, 5-7
          rep_ranges: [8, 5], // Min reps of ranges
          max_estimated: [150, 160], // Rough 1RM: weight * (1 + reps/30)
          created_at: new Date(),
        },
        {
          user_id: user.id,
          base_lift_id: squat.id,
          max_weights: [225, 245],
          rep_ranges: [5, 3],
          max_estimated: [250, 270],
          created_at: new Date(),
        },
      ],
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
