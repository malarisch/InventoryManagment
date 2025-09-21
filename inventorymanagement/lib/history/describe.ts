type HistoryOp = "INSERT" | "UPDATE" | "DELETE";

type SummaryConfig = {
  label: string;
  name?:
    | string
    | ((payload: Record<string, unknown>) => string | null | undefined);
};

const OP_VERBS: Record<HistoryOp, string> = {
  INSERT: "angelegt",
  UPDATE: "aktualisiert",
  DELETE: "geloescht",
};

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readField(payload: Record<string, unknown>, key: string): unknown {
  return payload[key];
}

function fallbackLabel(table: string): string {
  return table
    .split(/[_-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatCustomer(payload: Record<string, unknown>): string | null {
  const companyName = asString(readField(payload, "company_name"));
  if (companyName) return companyName;
  const forename = asString(readField(payload, "forename"));
  const surname = asString(readField(payload, "surname"));
  const fullName = [forename, surname].filter(Boolean).join(" ");
  return fullName.length > 0 ? fullName : null;
}

function formatCase(payload: Record<string, unknown>): string | null {
  const name = asString(readField(payload, "name"));
  if (name) return name;
  const id = asNumber(readField(payload, "id"));
  return id !== null ? `#${id}` : null;
}

function formatArticle(payload: Record<string, unknown>): string | null {
  const name = asString(readField(payload, "name"));
  if (name) return name;
  const id = asNumber(readField(payload, "id"));
  return id !== null ? `#${id}` : null;
}

function formatEquipment(payload: Record<string, unknown>): string | null {
  const assetTagId = asNumber(readField(payload, "asset_tag"));
  if (assetTagId !== null) return `Asset-Tag #${assetTagId}`;
  const articleId = asNumber(readField(payload, "article_id"));
  if (articleId !== null) return `Artikel #${articleId}`;
  const id = asNumber(readField(payload, "id"));
  return id !== null ? `#${id}` : null;
}

function formatAssetTag(payload: Record<string, unknown>): string | null {
  const printed = asString(readField(payload, "printed_code"));
  if (printed) return printed;
  const id = asNumber(readField(payload, "id"));
  return id !== null ? `#${id}` : null;
}

function formatLocation(payload: Record<string, unknown>): string | null {
  const name = asString(readField(payload, "name"));
  if (name) return name;
  const id = asNumber(readField(payload, "id"));
  return id !== null ? `#${id}` : null;
}

function formatJob(payload: Record<string, unknown>): string | null {
  const name = asString(readField(payload, "name"));
  if (name) return name;
  const id = asNumber(readField(payload, "id"));
  return id !== null ? `#${id}` : null;
}

function formatCompany(payload: Record<string, unknown>): string | null {
  const name = asString(readField(payload, "name"));
  if (name) return name;
  const id = asNumber(readField(payload, "id"));
  return id !== null ? `#${id}` : null;
}

function formatJobAsset(payload: Record<string, unknown>): string | null {
  const jobId = asNumber(readField(payload, "job_id"));
  const caseId = asNumber(readField(payload, "case_id"));
  const equipmentId = asNumber(readField(payload, "equipment_id"));

  const parts: string[] = [];
  if (jobId !== null) parts.push(`Job #${jobId}`);
  if (caseId !== null) parts.push(`Case #${caseId}`);
  if (equipmentId !== null) parts.push(`Equipment #${equipmentId}`);
  if (parts.length === 0) {
    const id = asNumber(readField(payload, "id"));
    if (id !== null) parts.push(`#${id}`);
  }
  return parts.length > 0 ? parts.join(" / ") : null;
}

const TABLE_SUMMARIES: Record<string, SummaryConfig> = {
  articles: { label: "Artikel", name: formatArticle },
  equipments: { label: "Equipment", name: formatEquipment },
  locations: { label: "Location", name: formatLocation },
  cases: { label: "Case", name: formatCase },
  customers: { label: "Kunde", name: formatCustomer },
  jobs: { label: "Job", name: formatJob },
  asset_tags: { label: "Asset-Tag", name: formatAssetTag },
  companies: { label: "Company", name: formatCompany },
  job_booked_assets: { label: "Job-Buchung", name: formatJobAsset },
  job_assets_on_job: { label: "Job-Zuweisung", name: formatJobAsset },
};

function formatName(
  payload: Record<string, unknown>,
  config: SummaryConfig | undefined,
): string | null {
  if (!config?.name) return null;
  if (typeof config.name === "string") {
    const value = readField(payload, config.name);
    return asString(value) ?? null;
  }
  return config.name(payload) ?? null;
}

function fallbackName(payload: Record<string, unknown>): string | null {
  const genericName = asString(readField(payload, "name"));
  if (genericName) return genericName;
  const id = asNumber(readField(payload, "id"));
  return id !== null ? `#${id}` : null;
}

export function describeHistoryEvent(
  table: string,
  op: string | null | undefined,
  payload: Record<string, unknown> | null | undefined,
): string | null {
  if (!op || !payload) return null;
  const opUpper = op.toUpperCase() as HistoryOp;
  const verb = OP_VERBS[opUpper];
  if (!verb) return null;
  const config = TABLE_SUMMARIES[table];
  const label = config?.label ?? fallbackLabel(table);
  const name = formatName(payload, config) ?? fallbackName(payload);
  if (name) return `${label} "${name}" ${verb}`;
  return `${label} ${verb}`;
}
