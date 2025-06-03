// server/src/utils/restorePlans.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs").promises;
const planController = require("../src/controllers/planController");

const prisma = new PrismaClient();

async function restoreGenericPlans() {
  try {
    // Read the backup file
    const data = await fs.readFile(
      "prisma/data/backup_generic_plans.json",
      "utf8"
    );
    const plans = JSON.parse(data);

    // Delete existing generic plans first
    await prisma.plans.deleteMany({
      where: { user_id: null },
    });

    // Restore each plan
    for (const plan of plans) {
      // First create a basic plan
      const basicPlan = await prisma.plans.create({
        data: {
          name: plan.name,
          categories: plan.categories || [],
          description: plan.description,
          duration_weeks: plan.duration_weeks,
          difficulty: plan.difficulty,
          goal: plan.goal,
          dayGroups: plan.dayGroups || "[]",
          user_id: null, // Ensure it's a generic plan
          created_at: plan.created_at || new Date(),
        },
      });

      // Create a mock request object with the plan data for updating
      const req = {
        params: {
          id: basicPlan.id.toString(),
        },
        body: {
          ...plan,
          // Ensure these fields are present even if they're null/empty
          categories: plan.categories || [],
          dayGroups: plan.dayGroups || "[]",
        },
        user: {
          userId: null, // This ensures it's updated as a generic plan
        },
      };

      // Create a mock response object
      const res = {
        status: (code) => ({
          json: (data) => {
            if (code >= 400) {
              console.error(`Error restoring plan ${plan.name}:`, data);
            } else {
              console.log(`Successfully restored plan ${plan.name}`);
            }
          },
        }),
        json: (data) => {
          console.log(`Successfully restored plan ${plan.name}`);
        },
      };

      // Use the controller's updatePlan function to restore all relationships
      await planController.updatePlan(req, res, (error) => {
        if (error) {
          console.error(`Error restoring plan ${plan.name}:`, error);
        }
      });
    }

    console.log("Restore completed successfully");
  } catch (error) {
    console.error("Restore failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// If this file is run directly (not imported as a module)
if (require.main === module) {
  console.log("Starting restore of generic plans...");
  restoreGenericPlans()
    .then(() => {
      console.log("Restore process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Restore process failed:", error);
      process.exit(1);
    });
}

module.exports = { restoreGenericPlans };
