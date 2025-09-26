import "dotenv/config"
import {defineConfig} from "prisma/config";

export default defineConfig({
    // required when using unstable features
    experimental: {
        externalTables: true,
//@ts-expect-error ts description is wrong
        multiSchema: true
    },
    // declare a `users` table
    tables: {
        external: [
            "auth.users",
            "storage.buckets",
            "storage.objects"
        ]
    }
})