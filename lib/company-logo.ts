import { normalizeFileArray } from "@/lib/files";

/**
 * Extract the first public logo image from company files.
 * Looks for images with "logo" in the name or description.
 */
export function getCompanyLogo(files: unknown): string | null {
  const fileArray = normalizeFileArray(files);
  
  // Look for public files that might be logos
  const logoFile = fileArray.find((file) => {
    // Must be public to display in header
    if (!file.public) return false;
    
    // Check if name or description contains "logo" (case-insensitive)
    const name = (file.name || file.id || "").toLowerCase();
    const description = (file.description || "").toLowerCase();
    
    return name.includes("logo") || description.includes("logo");
  });
  
  return logoFile?.link || null;
}