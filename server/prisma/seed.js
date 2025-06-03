const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const liftData = require("./data/liftData");
const userLiftsData = require("./data/userLiftsData");

const prisma = new PrismaClient();

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

    // Fetch all BaseLifts
    const createdLifts = await prisma.baseLifts.findMany();

    // Map lift names to IDs
    const liftMap = new Map(
      createdLifts.map((lift) => [lift.name.toLowerCase(), lift.id])
    );

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
