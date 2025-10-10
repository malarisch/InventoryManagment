/**
 * Scanner action handlers for different scanning modes.
 * 
 * Processes scanned asset tags and performs mode-specific actions:
 * - lookup: find and display asset information
 * - assign-location: update equipment/case/article location
 * - job-book: book assets to a job
 * - job-pack: mark assets as on-job
 * 
 * @module lib/scanner/actions
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/database.types";
import type { ResolvedAsset } from "./resolve";

export type ScannerMode = "lookup" | "assign-location" | "job-book" | "job-pack";

export interface ScannerActionContext {
  supabase: SupabaseClient<Database>;
  mode: ScannerMode;
  resolved: ResolvedAsset;
  targetLocationId?: number;
  targetLocationName?: string;
  jobId?: number;
  jobName?: string | null;
  jobCompanyId?: number;
}

export type ScannerActionStatus = "success" | "error" | "info";

export interface ScannerActionResult {
  status: ScannerActionStatus;
  message: string;
  entityType?: string;
  entityId?: number;
}

const GENERIC_ERROR = "Aktion konnte nicht ausgeführt werden.";

function formatJobName(jobId: number | undefined, jobName: string | null | undefined): string {
  if (jobName && jobName.trim().length > 0) return jobName.trim();
  if (typeof jobId === "number") return `Job #${jobId}`;
  return "Job";
}

function formatLocationName(locationId: number | undefined, locationName: string | null | undefined): string {
  if (locationName && locationName.trim().length > 0) return locationName.trim();
  if (typeof locationId === "number") return `Standort #${locationId}`;
  return "Standort";
}

async function assignEquipmentLocation(
  supabase: SupabaseClient<Database>,
  equipment: Pick<Tables<"equipments">, "id" | "current_location">,
  locationId: number,
): Promise<ScannerActionResult> {
  if (equipment.current_location === locationId) {
    return {
      status: "info",
      message: `Equipment #${equipment.id} ist bereits an diesem Standort.`,
      entityType: "equipment",
      entityId: equipment.id,
    };
  }

  const { error } = await supabase
    .from("equipments")
    .update({ current_location: locationId })
    .eq("id", equipment.id);

  if (error) {
    return {
      status: "error",
      message: error.message || GENERIC_ERROR,
      entityType: "equipment",
      entityId: equipment.id,
    };
  }

  return {
    status: "success",
    message: `Equipment #${equipment.id} wurde dem Standort zugewiesen.`,
    entityType: "equipment",
    entityId: equipment.id,
  };
}

async function assignCaseLocation(
  supabase: SupabaseClient<Database>,
  caseRow: Pick<Tables<"cases">, "id" | "case_equipment"> & {
    case_equipment_equipment?: Pick<Tables<"equipments">, "id" | "current_location"> | null;
  },
  locationId: number,
): Promise<ScannerActionResult> {
  const caseEquipmentId = caseRow.case_equipment ?? null;
  if (caseEquipmentId == null) {
    return {
      status: "error",
      message: "Case hat kein Case-Equipment. Standort kann nicht zugewiesen werden.",
      entityType: "case",
      entityId: caseRow.id,
    };
  }

  const currentEquipmentLocation = caseRow.case_equipment_equipment?.current_location ?? null;

  if (currentEquipmentLocation === locationId) {
    return {
      status: "info",
      message: `Case #${caseRow.id} (Equipment #${caseEquipmentId}) befindet sich bereits an diesem Standort.`,
      entityType: "case",
      entityId: caseRow.id,
    };
  }

  const { error } = await supabase
    .from("equipments")
    .update({ current_location: locationId })
    .eq("id", caseEquipmentId);

  if (error) {
    return {
      status: "error",
      message: error.message || GENERIC_ERROR,
      entityType: "case",
      entityId: caseRow.id,
    };
  }

  return {
    status: "success",
    message: `Case #${caseRow.id} steht nun mit Equipment #${caseEquipmentId} an diesem Standort.`,
    entityType: "case",
    entityId: caseRow.id,
  };
}

async function assignArticleLocation(
  supabase: SupabaseClient<Database>,
  article: Pick<Tables<"articles">, "id" | "default_location">,
  locationId: number,
): Promise<ScannerActionResult> {
  if (article.default_location === locationId) {
    return {
      status: "info",
      message: `Artikel #${article.id} ist bereits auf diesen Standort voreingestellt.`,
      entityType: "article",
      entityId: article.id,
    };
  }

  const { error } = await supabase
    .from("articles")
    .update({ default_location: locationId })
    .eq("id", article.id);

  if (error) {
    return {
      status: "error",
      message: error.message || GENERIC_ERROR,
      entityType: "article",
      entityId: article.id,
    };
  }

  return {
    status: "success",
    message: `Standard-Standort für Artikel #${article.id} gesetzt.`,
    entityType: "article",
    entityId: article.id,
  };
}

async function bookEquipmentForJob(
  supabase: SupabaseClient<Database>,
  jobId: number,
  equipmentId: number,
  companyId: number,
  jobName: string,
): Promise<ScannerActionResult> {
  const existing = await supabase
    .from("job_booked_assets")
    .select("id")
    .eq("job_id", jobId)
    .eq("equipment_id", equipmentId)
    .maybeSingle<{ id: number }>();

  if (existing.data) {
    return {
      status: "info",
      message: `Equipment #${equipmentId} ist bereits für ${jobName} gebucht.`,
      entityType: "equipment",
      entityId: equipmentId,
    };
  }

  const { error } = await supabase
    .from("job_booked_assets")
    .insert({ job_id: jobId, company_id: companyId, equipment_id: equipmentId });

  if (error) {
    return {
      status: "error",
      message: error.message || GENERIC_ERROR,
      entityType: "equipment",
      entityId: equipmentId,
    };
  }

  return {
    status: "success",
    message: `Equipment #${equipmentId} wurde für ${jobName} gebucht.`,
    entityType: "equipment",
    entityId: equipmentId,
  };
}

async function bookCaseForJob(
  supabase: SupabaseClient<Database>,
  jobId: number,
  caseId: number,
  companyId: number,
  jobName: string,
): Promise<ScannerActionResult> {
  const existing = await supabase
    .from("job_booked_assets")
    .select("id")
    .eq("job_id", jobId)
    .eq("case_id", caseId)
    .maybeSingle<{ id: number }>();

  if (existing.data) {
    return {
      status: "info",
      message: `Case #${caseId} ist bereits für ${jobName} gebucht.`,
      entityType: "case",
      entityId: caseId,
    };
  }

  const { error } = await supabase
    .from("job_booked_assets")
    .insert({ job_id: jobId, company_id: companyId, case_id: caseId });

  if (error) {
    return {
      status: "error",
      message: error.message || GENERIC_ERROR,
      entityType: "case",
      entityId: caseId,
    };
  }

  return {
    status: "success",
    message: `Case #${caseId} wurde für ${jobName} gebucht.`,
    entityType: "case",
    entityId: caseId,
  };
}

async function packEquipmentForJob(
  supabase: SupabaseClient<Database>,
  jobId: number,
  equipmentId: number,
  companyId: number,
  jobName: string,
): Promise<ScannerActionResult> {
  const existing = await supabase
    .from("job_assets_on_job")
    .select("id")
    .eq("job_id", jobId)
    .eq("equipment_id", equipmentId)
    .maybeSingle<{ id: number }>();

  if (existing.data) {
    return {
      status: "info",
      message: `Equipment #${equipmentId} ist bereits als gepackt vermerkt.`,
      entityType: "equipment",
      entityId: equipmentId,
    };
  }

  const { error } = await supabase
    .from("job_assets_on_job")
    .insert({ job_id: jobId, company_id: companyId, equipment_id: equipmentId });

  if (error) {
    return {
      status: "error",
      message: error.message || GENERIC_ERROR,
      entityType: "equipment",
      entityId: equipmentId,
    };
  }

  return {
    status: "success",
    message: `Equipment #${equipmentId} wurde für ${jobName} als gepackt erfasst.`,
    entityType: "equipment",
    entityId: equipmentId,
  };
}

async function packCaseForJob(
  supabase: SupabaseClient<Database>,
  jobId: number,
  caseId: number,
  companyId: number,
  jobName: string,
): Promise<ScannerActionResult> {
  const existing = await supabase
    .from("job_assets_on_job")
    .select("id")
    .eq("job_id", jobId)
    .eq("case_id", caseId)
    .maybeSingle<{ id: number }>();

  if (existing.data) {
    return {
      status: "info",
      message: `Case #${caseId} ist bereits als gepackt vermerkt.`,
      entityType: "case",
      entityId: caseId,
    };
  }

  const { error } = await supabase
    .from("job_assets_on_job")
    .insert({ job_id: jobId, company_id: companyId, case_id: caseId });

  if (error) {
    return {
      status: "error",
      message: error.message || GENERIC_ERROR,
      entityType: "case",
      entityId: caseId,
    };
  }

  return {
    status: "success",
    message: `Case #${caseId} wurde für ${jobName} als gepackt erfasst.`,
    entityType: "case",
    entityId: caseId,
  };
}

export async function performScannerAction({
  supabase,
  mode,
  resolved,
  targetLocationId,
  targetLocationName,
  jobId,
  jobName,
  jobCompanyId,
}: ScannerActionContext): Promise<ScannerActionResult> {
  if (resolved.kind === "not-found") {
    return { status: "error", message: "Kein Asset-Tag gefunden." };
  }

  if (resolved.kind === "asset-tag") {
    return {
      status: "error",
      message: "Asset-Tag ist keinem Objekt zugeordnet.",
    };
  }

  if (mode === "lookup") {
    switch (resolved.kind) {
      case "equipment":
        return {
          status: "success",
          message: `Equipment #${resolved.equipment.id} gefunden.`,
          entityType: "equipment",
          entityId: resolved.equipment.id,
        };
      case "case":
        return {
          status: "success",
          message: `Case #${resolved.case.id} gefunden.`,
          entityType: "case",
          entityId: resolved.case.id,
        };
      case "article":
        return {
          status: "success",
          message: `Artikel #${resolved.article.id} gefunden.`,
          entityType: "article",
          entityId: resolved.article.id,
        };
      case "location":
        return {
          status: "success",
          message: `Standort #${resolved.location.id} gefunden.`,
          entityType: "location",
          entityId: resolved.location.id,
        };
      default:
        return { status: "error", message: GENERIC_ERROR };
    }
  }

  if (mode === "assign-location") {
    if (typeof targetLocationId !== "number") {
      return { status: "error", message: "Bitte zuerst einen Standort auswählen." };
    }

    switch (resolved.kind) {
      case "equipment":
        return assignEquipmentLocation(supabase, resolved.equipment, targetLocationId);
      case "case":
        return assignCaseLocation(supabase, resolved.case, targetLocationId);
      case "article":
        return assignArticleLocation(supabase, resolved.article, targetLocationId);
      case "location":
        return {
          status: "info",
          message: `${formatLocationName(targetLocationId, targetLocationName)} bleibt ausgewählt.`,
          entityType: "location",
          entityId: resolved.location.id,
        };
      default:
        return { status: "error", message: GENERIC_ERROR };
    }
  }

  if (mode === "job-book" || mode === "job-pack") {
    if (typeof jobId !== "number" || typeof jobCompanyId !== "number") {
      return { status: "error", message: "Job-Kontext fehlt." };
    }

    const jobLabel = formatJobName(jobId, jobName);

    if (resolved.companyId !== jobCompanyId) {
      return {
        status: "error",
        message: `${resolved.kind === "equipment" ? "Equipment" : "Case"} gehört zu einer anderen Company.`,
      };
    }

    if (resolved.kind === "equipment") {
      return mode === "job-book"
        ? bookEquipmentForJob(supabase, jobId, resolved.equipment.id, jobCompanyId, jobLabel)
        : packEquipmentForJob(supabase, jobId, resolved.equipment.id, jobCompanyId, jobLabel);
    }

    if (resolved.kind === "case") {
      return mode === "job-book"
        ? bookCaseForJob(supabase, jobId, resolved.case.id, jobCompanyId, jobLabel)
        : packCaseForJob(supabase, jobId, resolved.case.id, jobCompanyId, jobLabel);
    }

    return {
      status: "error",
      message: "Nur Equipments oder Cases können Jobs zugeordnet werden.",
    };
  }

  return { status: "error", message: GENERIC_ERROR };
}
