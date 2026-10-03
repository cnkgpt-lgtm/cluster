import { runSeed } from "../src/lib/seed";
import { prisma } from "../src/lib/db";

runSeed()
  .then((log) => {
    log.forEach((l) => console.log(l));
    console.log("\nSeed selesai. Akun demo:");
    console.log("  pengurus@rtku.local / Pengurus123   (Pengurus)");
    console.log("  bendahara@rtku.local / Bendahara123 (Bendahara)");
    console.log("  sekretaris@rtku.local / Sekretaris123 (Sekretaris)");
    console.log("  warga@rtku.local / Warga123         (Warga)");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
