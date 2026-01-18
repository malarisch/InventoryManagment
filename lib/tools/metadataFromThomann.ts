import "@/lib/setup-env"
import "@/components/metadataTypes.types"
import { ArticleMetadata, Price, SupplierReference, Website } from "@/components/metadataTypes.types"
import axios from "axios"
import * as cheerio from 'cheerio';

function valueToCm(value: string, unit?: string): number | null {
    if (unit == "cm" || value.toLowerCase().includes("cm")) {
        const num = parseFloat(value.toLowerCase().replace("cm", "").trim().replace(",", "."))
        if (!isNaN(num)) {
            return num
        }
    } else if (unit == "mm" || value.toLowerCase().includes("mm")) {
        const num = parseFloat(value.toLowerCase().replace("mm", "").trim().replace(",", "."))
        if (!isNaN(num)) {
            return num / 10
        }
    }

    return null;
}
function parseListItem(label: string, value: string, article: ArticleMetadata): ArticleMetadata {
    console.log(`Parsing item: ${label}: ${value}`)
    if (label.includes("artikelnummer")) {
        article.manufacturerPartNumber = value
    } else if (label == "gewicht") {
        console.log("Parsing weight:", value)
        if (value.toLocaleLowerCase().includes("ca.")) {
            value = value.toLowerCase().replace("ca.", "").trim()
            article.notes = article.notes ? article.notes + " Approximate weight." : "Approximate weight."
        }
        if (value.toLowerCase().includes("kg")) {
            const num = parseFloat(value.toLowerCase().replace("kg", "").trim().replace(",", "."))
            if (!isNaN(num)) {
                article.weightKg = num
            }
        } else if (value.toLowerCase().includes("g")) {
            const num = parseFloat(value.toLowerCase().replace("g", "").trim().replace(",", "."))
            if (!isNaN(num)) {
                article.weightKg = num / 1000
            }
        }
    }
    else if ((label == "breite" || label.includes("außenbreite")) && !label.includes("innen")) {
        console.log("Parsing width:", value)
        if (!article.dimensionsCm) {
            article.dimensionsCm = { height: 0, width: 0, depth: undefined }
        }
        const cm = valueToCm(value)
        if (cm !== null) {
            article.dimensionsCm.width = cm
        }
    }
    else if ((label == "höhe" || label.includes("außenhöhe")) && !label.includes("innen") && !label.includes("einbauhöhe")) {
        console.log("Parsing height:", value)
        if (!article.dimensionsCm) {
            article.dimensionsCm = { height: 0, width: 0, depth: undefined }
        }
        const cm = valueToCm(value)
        if (cm !== null) {
            article.dimensionsCm.height = cm
        }
    }
    else if ((label == "tiefe" || label.includes("außentiefe")) && !label.includes("innen") && !label.includes("nutztiefe") && !label.includes("einbautiefe")) {
        console.log("Parsing depth:", value)
        if (!article.dimensionsCm) {
            article.dimensionsCm = { height: 0, width: 0, depth: undefined }
        }
        const cm = valueToCm(value)
        if (cm !== null) {
            article.dimensionsCm.depth = cm
        }
    }
    else if (label == "einbauhöhe") {

        const num = parseInt(value.toLowerCase().replace("he", "").trim().replace(",", "."))
        console.log("Parsed rack units:", num)
        if (!isNaN(num)) {
            article.heightUnits = num
            article.is19InchRackmountable = true
        }
    }
    else if (label == "vertikale höheneinheiten") {
        const num = parseInt(value.toLowerCase().replace("he", "").trim().replace(",", "."))
        if (!isNaN(num)) {
            if (!article.case) {
                article.case = {}
            }
            article.case.heightUnits = num
            article.case.is19InchRack = true

        }
    } else if (label.includes("nutztiefe")) {
        if (!article.case) {
            article.case = {}
        }
        const cm = valueToCm(value)
        if (cm !== null) {
            article.case.maxDeviceDepthCm = cm
        }
    } else if (label == "innenmaße (b x t x h)") {
        console.log("Parsing inner dimensions:", value)
        let unit = ""
        if (value.toLocaleLowerCase().includes("cm")) {
            value = value.toLowerCase().replace("cm", "").trim()
            unit = "cm"
        }
        if (value.toLocaleLowerCase().includes("mm")) {
            value = value.toLowerCase().replace("mm", "").trim()
            unit = "mm"
        }
        const parts = value.split("x")
        console.log("Inner dimension parts:", parts)
        if (parts.length === 3) {
            const widthCm = valueToCm(parts[0].trim(), unit)
            const depthCm = valueToCm(parts[1].trim(), unit)
            const heightCm = valueToCm(parts[2].trim(), unit)
            console.log(`Parsed inner dimensions - Width: ${widthCm}, Depth: ${depthCm}, Height: ${heightCm}`)
            if (!article.case) {
                article.case = {}
            }
            if (!article.case.innerDimensionsCm) {
                article.case.innerDimensionsCm = {
                    width: widthCm !== null ? widthCm : 0,
                    depth: depthCm !== null ? depthCm : 0,
                    height: heightCm !== null ? heightCm : 0
                }
            } else {
                if (widthCm !== null) {
                    article.case.innerDimensionsCm.width = widthCm
                }
                if (depthCm !== null) {
                    article.case.innerDimensionsCm.depth = depthCm
                }
                if (heightCm !== null) {
                    article.case.innerDimensionsCm.height = heightCm
                }
            }
        }
    } else if (label == "anschluss" || label == "anschlüsse") {
        article.interfaces = value.split(",").map(v => v.trim())
    } else if (label.includes("protokoll")) {
        article.connectivity = value.split(",").map(v => v.trim())
    }
    return article;
}
export async function metadataFromThomann(url: string): Promise<ArticleMetadata | null> {
    let article: ArticleMetadata = {
        type: ""
    }
    try {
        const urlObj = new URL(url)
        if (!urlObj.hostname.includes("thomann.de")) {
            return null
        }
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
            }
        })
        const html = response.data as string
        const $ = cheerio.load(html)
        const price: Price = {
            currency: "EUR",
            grossNet: "gross",
            taxRate: 19,
            discount: 0,
            amount: parseFloat($(".price.fx-text").text().split(" ")[0].replace(".", "").replace(",", "."))
        }
        const supplier: SupplierReference = {
            displayName: "Thomann",
            website: { url: url, description: "Product page on Thomann.de" } as Website,
            price,
        }
        article.manufacturer = $(".manufacturer__image").attr("alt") || undefined
        article.suppliers = [supplier]
        article.model = $(".stages__item--last").text().trim()
        const productText = $(".product-text")
        const keyFeatures = productText.find(".keyfeatures")
        for (const elem of keyFeatures.find("li").toArray()) {
            const label = $(elem).find(".keyfeature__label").text().trim().toLowerCase()
            const value = $(elem).find(".fx-text--bold").text().trim()
            if (label && value) {
                article = parseListItem(label, value, article)
            } else {
                console.log("Could not parse key feature item:", label, "Value", value)
            }
        }
        const productDetails = productText.find(".text-original").first()
        for (const elem of productDetails.find("li").toArray()) {
            const text = $(elem).text().trim()
            const parts = text.split(":")
            if (parts.length >= 2) {
                const label = parts[0].trim().toLowerCase()
                const value = parts.slice(1).join(":").trim()
                article = parseListItem(label, value, article)
            }
        }
        if (article.case && article.case.innerDimensionsCm && !article.case.is19InchRack) {
            article.case.isGeneralCase = true
        }
        return article;
    } catch (e) {
        console.error("Invalid URL:", e)
        return null
    }
}