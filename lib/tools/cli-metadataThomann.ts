import "@/lib/setup-env"
import {metadataFromThomann} from "@/lib/tools/metadataFromThomann"

import { ArticleMetadata } from "@/components/metadataTypes.types"

async function run() {
    const url = process.argv[2]
    if (!url) {
        console.error("Please provide a Thomann URL as the first argument.")
        process.exit(1)
    }

    try {
        const article: ArticleMetadata | null = await metadataFromThomann(url)
        if (article) {
            console.log(JSON.stringify(article, null, 2))
        } else {
            console.error("Failed to retrieve article metadata.")
            process.exit(1)
        }
    } catch (e) {
        console.error("Error fetching metadata:", e)
        process.exit(1)
    }
}

run()