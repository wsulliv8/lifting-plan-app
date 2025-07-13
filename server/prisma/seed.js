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

    // Create Admin User
    const adminUser = await prisma.users.create({
      data: {
        email: "admin@example.com",
        username: "admin",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
        experience: "advanced",
        created_at: new Date(),
      },
    });

    console.log("Admin user created:", {
      id: adminUser.id,
      email: adminUser.email,
      username: adminUser.username,
      role: adminUser.role,
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

    // Generate UserLiftsData with new rep_range_progress structure
    const userLiftsDataEntries = userLiftsData
      .map((lift) => {
        const base_lift_id = liftMap.get(lift.name.toLowerCase());
        if (!base_lift_id) {
          console.warn(`Base lift not found for ${lift.name}`);
          return null;
        }

        // If lift has no rep_range_progress yet, create it from max_weights and rep_ranges
        if (!lift.rep_range_progress) {
          const rep_range_progress = { rep_ranges: {} };

          lift.rep_ranges.forEach((reps, index) => {
            const weight = lift.max_weights[index];
            if (weight > 0) {
              // Only create entries for weights > 0
              rep_range_progress.rep_ranges[reps] = {
                current: { weight },
                history: [
                  { date: "2025-05-20", weight },
                  { date: "2025-05-13", weight: Math.round(weight * 0.95) },
                  { date: "2025-05-06", weight: Math.round(weight * 0.9) },
                ],
              };
            }
          });

          lift.rep_range_progress = rep_range_progress;
        }

        // Calculate set_counts based on lift type
        const isMainLift =
          liftData.find((l) => l.name.toLowerCase() === lift.name.toLowerCase())
            ?.lift_type === "Main";

        // Get unique rep ranges from the progress data
        const uniqueRepRanges = Object.keys(
          lift.rep_range_progress.rep_ranges
        ).map(Number);
        const set_counts = Array(uniqueRepRanges.length).fill(
          isMainLift ? 3 : 2
        );

        // Generate week_starts
        const week_starts = [
          new Date("2025-05-20"),
          new Date("2025-05-13"),
          new Date("2025-05-06"),
        ];

        // Calculate weekly_reps and weekly_volume using current weights
        const weekly_reps = uniqueRepRanges.map(
          (reps) => set_counts[0] * reps // Using first set_count since they're all the same
        );

        const weekly_volume = uniqueRepRanges.map(
          (reps) =>
            set_counts[0] *
            reps *
            lift.rep_range_progress.rep_ranges[reps].current.weight
        );

        return {
          user_id: user.id,
          base_lift_id,
          rep_range_progress: lift.rep_range_progress,
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
