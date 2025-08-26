// scripts/create-admin.ts

import { Role } from "@prisma/client";
import { prisma } from "@/lib/db"; // Import the shared prisma instance
import * as bcrypt from "bcryptjs"; // Use bcryptjs to match your auth setup

async function main() {
  // 1. Get credentials from environment variables
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  console.log("Admin Email:", adminEmail);
  console.log("Admin Password:", adminPassword ? "[PROVIDED]" : "[NOT PROVIDED]");

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file"
    );
  }

  // 2. Check if the admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin user already exists.");
    return;
  }

  // 3. Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // 4. Create the new admin user in the database
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN, // Assign the ADMIN role from your enum
      authMethod: "EMAIL",
      isVerified: true, // Set the admin as verified by default
      firstName: "Admin",
      lastName: "User",
    },
  });

  console.log("✅ Admin user created successfully!");
  console.log("User ID:", adminUser.id);
  console.log("Email:", adminUser.email);
  console.log("Role:", adminUser.role);
}

// Execute the script and handle potential errors
main()
  .catch((e) => {
    console.error("An error occurred while creating the admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect the Prisma Client
    await prisma.$disconnect();
  });