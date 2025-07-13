const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email) {
      console.log("Usage:");
      console.log("  Promote existing user: node createAdmin.js user@example.com");
      console.log("  Create new admin: node createAdmin.js user@example.com password123");
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Promote existing user to admin
      const user = await prisma.users.update({
        where: { email },
        data: { role: "admin" },
      });
      console.log(`✅ User ${user.username} (${user.email}) is now an admin!`);
      return;
    }

    // Create new admin user
    if (!password) {
      console.log("❌ User not found. Please provide a password to create a new admin user:");
      console.log(`   node createAdmin.js ${email} your-secure-password`);
      return;
    }

    const adminUser = await prisma.users.create({
      data: {
        email,
        username: email.split('@')[0], // Use email prefix as username
        password: await bcrypt.hash(password, 10),
        role: "admin",
        experience: "advanced",
        created_at: new Date(),
      },
    });

    console.log("✅ Admin user created:", {
      id: adminUser.id,
      email: adminUser.email,
      username: adminUser.username,
      role: adminUser.role,
    });

    console.log("\n🔑 Login credentials:");
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${password}`);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.error("❌ Error: Email or username already exists");
    } else {
      console.error("❌ Error creating admin:", error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
