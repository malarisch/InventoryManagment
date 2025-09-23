import { normalizeFileArray } from "@/lib/files";

/**
 * Extract the company logo URL from company data.
 * First checks metadata.logoUrl, then falls back to searching files array for logo images.
 */
export function getCompanyLogo(company: { files?: unknown; metadata?: unknown } | null): string | null {
  if (!company) return null;

  // First priority: Check if there's a logoUrl in the metadata
  try {
    const metadata = company.metadata as Record<string, unknown> | null;
    if (metadata?.logoUrl && typeof metadata.logoUrl === 'string' && metadata.logoUrl.trim()) {
      return metadata.logoUrl.trim();
    }
  } catch {
    // Ignore metadata parsing errors and continue to files fallback
  }

  // Fallback: Look for logo-like files in the files array
  const fileArray = normalizeFileArray(company.files);
  
  // Look for public files that might be logos
  const logoFile = fileArray.find((file) => {
    // Must be public to display in header
    if (!file.public) return false;
    
    // Check if name, description, or file path suggests it's a logo
    const name = (file.name || file.id || "").toLowerCase();
    const description = (file.description || "").toLowerCase();
    
    // Look for "logo" in name or description
    if (name.includes("logo") || description.includes("logo")) {
      return true;
    }
    
    // Look for common logo file name patterns
    if (name.includes("brand") || name.includes("identity") || name.includes("symbol")) {
      return true;
    }
    
    // If it's an image file and the only public image, assume it might be a logo
    const isImage = /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(name);
    if (isImage) {
      const publicImages = fileArray.filter(f => f.public && /\.(png|jpg|jpeg|svg|gif|webp)$/i.test((f.name || f.id || "").toLowerCase()));
      if (publicImages.length === 1) {
        return true; // Only public image, probably a logo
      }
    }
    
    return false;
  });
  
  return logoFile?.link || null;
}