// server/src/utils/backupPlans.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs").promises;

const prisma = new PrismaClient();

async function backupGenericPlans() {
  try {
    const plans = await prisma.plans.findMany({
      where: { user_id: null },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                workoutDays: {
                  include: {
                    workout: {
                      include: {
                        lifts: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    await fs.writeFile(
      "prisma/data/backup_generic_plans.json",
      JSON.stringify(plans, null, 2)
    );
    console.log("Backup completed: prisma/data/backup_generic_plans.json");
  } catch (error) {
    console.error("Backup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// If this file is run directly (not imported as a module)
if (require.main === module) {
  console.log("Starting backup of generic plans...");
  backupGenericPlans()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Backup failed:", error);
      process.exit(1);
    });
}

module.exports = { backupGenericPlans };
