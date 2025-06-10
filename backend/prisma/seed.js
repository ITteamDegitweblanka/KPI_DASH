"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    // Create a default admin user
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: await (0, bcryptjs_1.hash)('admin123', 10),
            firstName: 'Admin',
            lastName: 'User',
            displayName: 'Admin',
            role: 'SUPER_ADMIN',
        },
    });
    console.log('Database seeded successfully!');
    console.log(`Admin user created with email: ${admin.email}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
