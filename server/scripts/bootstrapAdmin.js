
require("dotenv").config();

const prisma = require("../src/config/database");

async function bootstrapAdmin() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;

  if (!email) {
    throw new Error("ADMIN_BOOTSTRAP_EMAIL is missing from .env");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    throw new Error("No registered user found with that email");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        role: "ADMIN",
        status: "ACTIVE",
      },
    }),
    prisma.onboarding.update({
      where: { userId: user.id },
      data: {
        status: "APPROVED",
        remarks: "Initial administrator bootstrap",
        reviewedAt: new Date(),
      },
    }),
  ]);

  console.log("First administrator successfully created.");
  console.log("Admin email:", user.email);
}

bootstrapAdmin()
  .catch((error) => {
    console.error("Admin bootstrap failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
