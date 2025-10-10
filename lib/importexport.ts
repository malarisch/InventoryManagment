/**
 * Company data import/export utilities.
 * 
 * Provides functions to export complete company data (including all related entities)
 * and import it under a new company ownership. Used for company backup/restore and
 * data migration workflows.
 * 
 * @module lib/importexport
 */
import {
    articles,
    asset_tag_templates,
    asset_tags,
    cases,
    companies,
    contacts,
    equipments,
    history,
    job_assets_on_job,
    job_booked_assets,
    jobs,
    locations,
    nfc_tags,
    maintenance_logs,
    workshop_todos,
    Prisma,
    PrismaClient,
    profiles,
    users_companies
} from "./generated/prisma";
import {DefaultArgs} from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

type TransactionalPrisma = Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">

type CompanyData = Prisma.PromiseReturnType<typeof getCompanyData>

export async function getCompanyData(companyId: string) {
    return prisma.companies.findUnique({
        where: {id: BigInt(companyId)},
        include: {
            profiles: true,
            users_companies: true,
            locations: true,
            asset_tag_templates: true,
            articles: true,
            equipments: true,
            cases: true,
            contacts: true,
            jobs: true,
            job_assets_on_job: true,
            job_booked_assets: true,
            nfc_tags: true,
            asset_tags: true,
            history: true,
            maintenance_logs: true,
            workshop_todos: true


            // Add other related models as needed
        },
    });
}


export async function importCompanyData(companyData: CompanyData, newUser: string) {
    // Start a transaction to ensure data integrity
    return prisma.$transaction(async (prisma: TransactionalPrisma) => {
        if (!companyData) {
            throw new Error("No company data provided");
        }
        // Create the company first
        const {
            id: _id,
            created_at: _createdAt,
            profiles: _profiles,
            users_companies: _users_companies,
            articles: _articles,
            equipments: _equipments,
            contacts: _contacts,
            jobs: _jobs,
            job_assets_on_job: _job_assets_on_job,
            job_booked_assets: _job_booked_assets,
            asset_tags: _asset_tags,
            nfc_tags: _nfc_tags,
            history: _history,
            cases: _cases,
            locations: _locations,
            asset_tag_templates: _asset_tag_templates,
            maintenance_logs: _maintenance_logs,
            workshop_todos: _workshop_todos,
            ...companyInfo
        } = companyData as Omit<companies, "updated_at"> & {
            articles: articles[],
            equipments: equipments[],
            contacts: contacts[],
            jobs: jobs[],
            job_assets_on_job: job_assets_on_job[],
            job_booked_assets: job_booked_assets[],
            asset_tags: asset_tags[],
            nfc_tags: nfc_tags[],
            history: history[],
            cases: cases[],
            locations: locations[],
            asset_tag_templates: asset_tag_templates[],
            users_companies: users_companies[],
            profiles: profiles | null,
            maintenance_logs: maintenance_logs[],
            workshop_todos: workshop_todos[],
        };


        // ALWAYS create a new company on import - never update existing
        // If a company with the same name exists, add a suffix to avoid conflicts
        let companyName = companyInfo.name;
        const existingCompany = await prisma.companies.findFirst({
            where: {
                name: companyName,
                owner_user_id: newUser,
            }
        });

        if (existingCompany) {
            // Add timestamp suffix to avoid name collision
            const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            companyName = `${companyName} (Import ${timestamp})`;
        }

        

        const upsertedCompany = await prisma.companies.create({
            data: {
                name: companyName,
                description: (companyInfo as { description?: string | null }).description ?? null,
                owner_user_id: newUser,
                metadata: companyInfo.metadata ?? Prisma.JsonNull,
                files: companyInfo.files ?? Prisma.JsonNull,
            },
        });


        // users_companies membership will be created later to follow requested order

        const companyIdMap: Record<string, bigint> = {};
        companyIdMap[companyData.id.toString()] = upsertedCompany.id;


        // IDs für verschiedene Entitäten speichern
    const profileIdMap: Record<string, string> = {};
    const locationIdMap: Record<string, bigint> = {};
    const articleIdMap: Record<string, bigint> = {};
    const equipmentIdMap: Record<string, bigint> = {};
    const contactIdMap: Record<string, bigint> = {};
    const jobIdMap: Record<string, bigint> = {};
    const assetTagIdMap: Record<string, bigint> = {};
    const templateIdMap: Record<string, bigint> = {};
    const nfcTagIdMap: Record<string, bigint> = {};
    const caseIdMap: Record<string, bigint> = {};
    const maintenanceLogIdMap: Record<string, bigint> = {};
    const workshopTodoIdMap: Record<string, bigint> = {};
    const historyIdMap: Record<string, bigint> = {};

        // Profile importieren
        if (companyData.profiles) {
            const profile = companyData.profiles;
            const {id: oldId} = profile;
            profileIdMap[oldId] = newUser;
        }

        // Asset Tag Templates importieren (first, as requested)
        if (companyData.asset_tag_templates && companyData.asset_tag_templates.length > 0) {
            for (const template of companyData.asset_tag_templates) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    created_by: _createdBy,
                    ...templateData
                } = template as Omit<asset_tag_templates, "updated_at">;
                templateData.company_id = upsertedCompany.id;

                const newTemplate = await prisma.asset_tag_templates.create({
                    data: {
                        ...templateData,
                        created_by: newUser,
                        template: templateData.template ?? Prisma.JsonNull
                    }
                });
                templateIdMap[oldId.toString()] = newTemplate.id;
            }
        }

        // History EARLY insert (requested order), we'll backfill data_id later
        if (companyData.history && companyData.history.length > 0) {
            for (const historyItem of companyData.history) {
                const { id: oldId, created_at: _createdAt, ...historyData } = historyItem as Omit<history, "updated_at">;
                historyData.company_id = upsertedCompany.id;

                // Ensure change_made_by references the importing user to satisfy FK
                (historyData as unknown as { change_made_by?: string | null }).change_made_by = newUser;

                const created = await prisma.history.create({
                    data: {
                        ...historyData,
                        old_data: historyData.old_data ?? Prisma.JsonNull
                    }
                });
                historyIdMap[oldId.toString()] = created.id;
            }
        }

        // NFC Tags importieren (after history as requested)
        if (companyData.nfc_tags && companyData.nfc_tags.length > 0) {
            for (const nfcTag of companyData.nfc_tags) {
                const { id: oldId, created_at: _createdAt, created_by: _createdBy, ...nfcTagData } = nfcTag as Omit<nfc_tags, "updated_at">;
                const newNfc = await prisma.nfc_tags.create({
                    data: {
                        ...nfcTagData,
                        company_id: upsertedCompany.id,
                        created_by: newUser,
                    }
                });
                nfcTagIdMap[oldId.toString()] = newNfc.id;
            }
        }

        // users_companies membership (after nfc_tags to follow requested order)
        await prisma.users_companies.create({
            data: {
                company_id: upsertedCompany.id,
                user_id: newUser,
            }
        })

        // Asset Tags importieren (nach Templates und NFC Tags)
        if (companyData.asset_tags && companyData.asset_tags.length > 0) {
            for (const assetTag of companyData.asset_tags) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    created_by: _createdBy,
                    ...assetTagData
                } = assetTag as Omit<asset_tags, "updated_at">;
                assetTagData.company_id = upsertedCompany.id;

                // Remap printed_template
                if ((assetTagData as { printed_template?: bigint | null }).printed_template) {
                    const pt = (assetTagData as { printed_template?: bigint | null }).printed_template!;
                    const mapped = templateIdMap[pt.toString()];
                    (assetTagData as { printed_template?: bigint | null }).printed_template = mapped ?? null;
                }
                // Remap nfc_tag_id
                if ((assetTagData as { nfc_tag_id?: bigint | null }).nfc_tag_id) {
                    const nt = (assetTagData as { nfc_tag_id?: bigint | null }).nfc_tag_id!;
                    const mappedNfc = nfcTagIdMap[nt.toString()];
                    (assetTagData as { nfc_tag_id?: bigint | null }).nfc_tag_id = mappedNfc ?? null;
                }

                const newAssetTag = await prisma.asset_tags.create({
                    data: {
                        ...assetTagData,
                        created_by: newUser
                    }
                });
                assetTagIdMap[oldId.toString()] = newAssetTag.id;
            }
        }

        // Kontakte importieren (noch vor Jobs, damit jobs.contact_id gemappt werden kann)
        const contactsSourceEarly = (companyData as Record<string, unknown>).contacts as ReadonlyArray<contacts> | undefined
          ?? (companyData as Record<string, unknown>).customers as ReadonlyArray<contacts & { customer_type?: string }> | undefined
          ?? [];
        if (contactsSourceEarly && contactsSourceEarly.length > 0) {
            for (const contact of contactsSourceEarly) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    created_by: _createdBy,
                    ...contactData
                } = contact as Omit<contacts, "updated_at"> & { customer_type?: string; address?: string };

                let display = contactData.display_name
                  ?? contactData.company_name
                  ?? `${contactData.forename ?? contactData.first_name ?? ''} ${contactData.surname ?? contactData.last_name ?? ''}`.trim();
                if (!display || display.length === 0) {
                  display = `Kontakt #${oldId}`;
                }

                const newContact = await prisma.contacts.create({
                    data: {
                        company_id: upsertedCompany.id,
                        created_by: newUser,
                        contact_type: contactData.contact_type ?? 'customer',
                        customer_type: (contactData as { customer_type?: string }).customer_type ?? null,
                        display_name: display,
                        company_name: contactData.company_name ?? contactData.organization ?? null,
                        organization: contactData.organization ?? contactData.company_name ?? null,
                        forename: contactData.forename ?? contactData.first_name ?? null,
                        surname: contactData.surname ?? contactData.last_name ?? null,
                        first_name: contactData.first_name ?? contactData.forename ?? null,
                        last_name: contactData.last_name ?? contactData.surname ?? null,
                        email: contactData.email ?? null,
                        phone: contactData.phone ?? null,
                        has_signal: contactData.has_signal ?? false,
                        has_whatsapp: contactData.has_whatsapp ?? false,
                        has_telegram: contactData.has_telegram ?? false,
                        role: contactData.role ?? null,
                        street: contactData.street ?? (contactData as { address?: string }).address ?? null,
                        address: (contactData as { address?: string }).address ?? contactData.street ?? null,
                        city: contactData.city ?? null,
                        state: contactData.state ?? null,
                        zip_code: contactData.zip_code ?? contactData.postal_code ?? null,
                        postal_code: contactData.postal_code ?? contactData.zip_code ?? null,
                        country: contactData.country ?? null,
                        notes: contactData.notes ?? null,
                        website: contactData.website ?? null,
                        metadata: (contactData.metadata as Prisma.JsonValue | null) ?? Prisma.JsonNull,
                        files: ((contactData as { files?: Prisma.JsonValue | null }).files) ?? Prisma.JsonNull,
                    },
                });
                contactIdMap[oldId.toString()] = newContact.id;
            }
        }

        // Jobs importieren (requested before locations/articles/equipments)
        if (companyData.jobs && companyData.jobs.length > 0) {
            for (const job of companyData.jobs) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    created_by: _createdBy,
                    ...jobData
                } = job as Omit<jobs, "updated_at"> & { customer_id?: bigint | null };
                jobData.company_id = upsertedCompany.id;

                // Kontakt-ID aktualisieren (Legacy customer_id wird auf contact_id gemappt)
                if (jobData.customer_id && contactIdMap[jobData.customer_id.toString()]) {
                    jobData.contact_id = contactIdMap[jobData.customer_id.toString()];
                }
                if (jobData.contact_id && contactIdMap[jobData.contact_id.toString()]) {
                    jobData.contact_id = contactIdMap[jobData.contact_id.toString()];
                }
                delete (jobData as Record<string, unknown>).customer_id;

                // Parse date fields if they're strings
                if (jobData.startdate && typeof jobData.startdate === 'string') {
                    jobData.startdate = new Date(jobData.startdate);
                }
                if (jobData.enddate && typeof jobData.enddate === 'string') {
                    jobData.enddate = new Date(jobData.enddate);
                }

                const newJob = await prisma.jobs.create({
                    data: {
                        ...jobData,
                        created_by: newUser,
                        meta: jobData.meta ?? Prisma.JsonNull,
                        files: jobData.files ?? Prisma.JsonNull,
                    }
                });
                jobIdMap[oldId.toString()] = newJob.id;
            }
        }

        // Locations importieren (after jobs per requested order)
        if (companyData.locations && companyData.locations.length > 0) {
            for (const location of companyData.locations) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    created_by: _createdBy,
                    ...locationData
                } = location as Omit<locations, "updated_at">;
                locationData.company_id = upsertedCompany.id;

                // Asset Tag ID remappen, falls vorhanden
                if (locationData.asset_tag && assetTagIdMap[locationData.asset_tag.toString()]) {
                    locationData.asset_tag = assetTagIdMap[locationData.asset_tag.toString()];
                }

                const newLocation = await prisma.locations.create({
                    data: {
                        ...locationData,
                        created_by: newUser,
                        files: locationData.files ?? Prisma.JsonNull
                    }
                });
                locationIdMap[oldId.toString()] = newLocation.id;
            }
        }

        // (Templates bereits oben importiert)

        // Artikel importieren (after locations)
        if (companyData.articles && companyData.articles.length > 0) {
            for (const article of companyData.articles) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    created_by: _createdBy,
                    ...articleData
                } = article as Omit<articles, "updated_at">;
                articleData.company_id = upsertedCompany.id;

                // Default Location ID remappen, falls vorhanden
                if (articleData.default_location && locationIdMap[articleData.default_location.toString()]) {
                    articleData.default_location = locationIdMap[articleData.default_location.toString()];
                }

                // Asset Tag ID remappen, falls vorhanden
                if (articleData.asset_tag && assetTagIdMap[articleData.asset_tag.toString()]) {
                    articleData.asset_tag = assetTagIdMap[articleData.asset_tag.toString()];
                }

                const newArticle = await prisma.articles.create({
                    data: {
                        ...articleData,
                        created_by: newUser,
                        metadata: articleData.metadata ?? Prisma.JsonNull,
                        files: articleData.files ?? Prisma.JsonNull,
                    }
                });
                articleIdMap[oldId.toString()] = newArticle.id;
            }
        }

        // Equipment importieren (after articles)
        if (companyData.equipments && companyData.equipments.length > 0) {
            for (const equipment of companyData.equipments) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    created_by: _createdBy,
                    ...equipmentData
                } = equipment as Omit<equipments, "updated_at">;
                equipmentData.company_id = upsertedCompany.id;

                // Artikel-ID aktualisieren, falls vorhanden
                if (equipmentData.article_id && articleIdMap[equipmentData.article_id.toString()]) {
                    equipmentData.article_id = articleIdMap[equipmentData.article_id.toString()];
                }

                // Asset Tag ID remappen, falls vorhanden
                if (equipmentData.asset_tag && assetTagIdMap[equipmentData.asset_tag.toString()]) {
                    equipmentData.asset_tag = assetTagIdMap[equipmentData.asset_tag.toString()];
                }

                // Current Location remappen, falls vorhanden
                if (equipmentData.current_location && locationIdMap[equipmentData.current_location.toString()]) {
                    equipmentData.current_location = locationIdMap[equipmentData.current_location.toString()];
                }

                // Parse added_to_inventory_at if it's a string
                if (equipmentData.added_to_inventory_at && typeof equipmentData.added_to_inventory_at === 'string') {
                    equipmentData.added_to_inventory_at = new Date(equipmentData.added_to_inventory_at);
                }

                const newEquipment = await prisma.equipments.create({
                    data: {
                        ...equipmentData,
                        created_by: newUser,
                        metadata: equipmentData.metadata ?? Prisma.JsonNull,
                        files: equipmentData.files ?? Prisma.JsonNull,
                    }
                });
                equipmentIdMap[oldId.toString()] = newEquipment.id;
            }
        }

                // (Contacts and Jobs were already imported earlier to satisfy requested ordering)

        // Cases importieren (nach Equipments/Locations wegen FKs) — moved up before job assets per requested order
        if (companyData.cases && companyData.cases.length > 0) {
            for (const caseItem of companyData.cases) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    created_by: _createdBy,
                    ...caseData
                } = caseItem as Omit<cases, "updated_at">;
                caseData.company_id = upsertedCompany.id;

                // Remap asset_tag, case_equipment, current_location
                if (caseData.asset_tag && assetTagIdMap[caseData.asset_tag.toString()]) {
                    caseData.asset_tag = assetTagIdMap[caseData.asset_tag.toString()];
                }
                if (caseData.case_equipment && equipmentIdMap[caseData.case_equipment.toString()]) {
                    caseData.case_equipment = equipmentIdMap[caseData.case_equipment.toString()];
                }
                if ((caseData as unknown as { current_location?: bigint | null }).current_location && locationIdMap[(caseData as unknown as { current_location?: bigint | null }).current_location!.toString()]) {
                    (caseData as unknown as { current_location?: bigint | null }).current_location = locationIdMap[(caseData as unknown as { current_location?: bigint | null }).current_location!.toString()];
                }

                // Remap contains_equipments array if present
                if (Array.isArray(caseData.contains_equipments) && caseData.contains_equipments.length > 0) {
                    caseData.contains_equipments = caseData.contains_equipments.map((eid) => {
                        const mapped = equipmentIdMap[eid.toString()];
                        return mapped ?? eid;
                    });
                }

                const newCase = await prisma.cases.create({
                    data: {
                        ...caseData,
                        created_by: newUser,
                        contains_articles: (caseData.contains_articles as Prisma.InputJsonValue[]) ?? Prisma.JsonNull,
                        files: caseData.files ?? Prisma.JsonNull,
                    }
                });
                caseIdMap[oldId.toString()] = newCase.id;
            }
        }

        // Job Assets on Job importieren
        if (companyData.job_assets_on_job && companyData.job_assets_on_job.length > 0) {
            for (const jobAsset of companyData.job_assets_on_job) {
                const {
                    id: _id,
                    created_at: _createdAt,
                    created_by: _createdBy,
                    ...jobAssetData
                } = jobAsset as Omit<job_assets_on_job, "updated_at">;
                jobAssetData.company_id = upsertedCompany.id;

                // Job und Equipment IDs aktualisieren
                if (jobAssetData.job_id && jobIdMap[jobAssetData.job_id.toString()]) {
                    jobAssetData.job_id = jobIdMap[jobAssetData.job_id.toString()];
                }

                if (jobAssetData.equipment_id && equipmentIdMap[jobAssetData.equipment_id.toString()]) {
                    jobAssetData.equipment_id = equipmentIdMap[jobAssetData.equipment_id.toString()];
                }

                if ((jobAssetData as { case_id?: bigint | null }).case_id && caseIdMap[(jobAssetData as { case_id?: bigint | null }).case_id!.toString()]) {
                    (jobAssetData as { case_id?: bigint | null }).case_id = caseIdMap[(jobAssetData as { case_id?: bigint | null }).case_id!.toString()];
                }

                await prisma.job_assets_on_job.create({
                    data: {
                        ...jobAssetData,
                        created_by: newUser
                    }
                });
            }
        }

        // Job Booked Assets importieren
        if (companyData.job_booked_assets && companyData.job_booked_assets.length > 0) {
            for (const bookedAsset of companyData.job_booked_assets) {
                const {
                    id: _id,
                    created_at: _createdAt,
                    created_by: _createdBy,
                    ...bookedAssetData
                } = bookedAsset as Omit<job_booked_assets, "updated_at">;
                bookedAssetData.company_id = upsertedCompany.id;

                // Job und Equipment IDs aktualisieren
                if (bookedAssetData.job_id && jobIdMap[bookedAssetData.job_id.toString()]) {
                    bookedAssetData.job_id = jobIdMap[bookedAssetData.job_id.toString()];
                }

                if (bookedAssetData.equipment_id && equipmentIdMap[bookedAssetData.equipment_id.toString()]) {
                    bookedAssetData.equipment_id = equipmentIdMap[bookedAssetData.equipment_id.toString()];
                }

                if ((bookedAssetData as { case_id?: bigint | null }).case_id && caseIdMap[(bookedAssetData as { case_id?: bigint | null }).case_id!.toString()]) {
                    (bookedAssetData as { case_id?: bigint | null }).case_id = caseIdMap[(bookedAssetData as { case_id?: bigint | null }).case_id!.toString()];
                }

                await prisma.job_booked_assets.create({
                    data: {
                        ...bookedAssetData,
                        created_by: newUser
                    }
                });
            }
        }

        // Workshop Todos importieren (after job assets)
        if ((companyData as Record<string, unknown>).workshop_todos && (companyData as Record<string, unknown>).workshop_todos instanceof Array) {
            for (const wtItem of (companyData as unknown as { workshop_todos: workshop_todos[] }).workshop_todos) {
                const wt = wtItem as Partial<workshop_todos> & { id: bigint };
                const oldId = wt.id;
                const remappedEquipment = wt.equipment_id ? (equipmentIdMap[wt.equipment_id.toString()] ?? wt.equipment_id) : null;
                const remappedCase = wt.case_id ? (caseIdMap[wt.case_id.toString()] ?? wt.case_id) : null;
                const parsedDue = wt.due_date && typeof wt.due_date === 'string' ? new Date(wt.due_date) : (wt.due_date ?? null);
                const parsedClosed = wt.closed_at && typeof wt.closed_at === 'string' ? new Date(wt.closed_at) : (wt.closed_at ?? null);

                const payload = {
                    company_id: upsertedCompany.id,
                    created_by: newUser,
                    equipment_id: remappedEquipment,
                    case_id: remappedCase,
                    title: (wt.title as string) ?? `Todo #${oldId}`,
                    notes: (wt.notes as string | null) ?? null,
                    status: (wt.status as string) ?? 'open',
                    due_date: parsedDue,
                    closed_at: parsedClosed,
                    files: (wt.files as Prisma.JsonValue | null) ?? Prisma.JsonNull,
                } as unknown as Prisma.workshop_todosCreateInput;

                const inserted = await prisma.workshop_todos.create({ data: payload });
                workshopTodoIdMap[oldId.toString()] = inserted.id;
            }
        }

        // Maintenance Logs importieren (after workshop todos)
        if ((companyData as Record<string, unknown>).maintenance_logs && (companyData as Record<string, unknown>).maintenance_logs instanceof Array) {
            for (const mlItem of (companyData as unknown as { maintenance_logs: maintenance_logs[] }).maintenance_logs) {
                const ml = mlItem as Partial<maintenance_logs> & { id: bigint };
                const oldId = ml.id;
                const remappedEquipment = ml.equipment_id ? (equipmentIdMap[ml.equipment_id.toString()] ?? ml.equipment_id) : null;
                const remappedCase = ml.case_id ? (caseIdMap[ml.case_id.toString()] ?? ml.case_id) : null;
                const parsedPerformedAt = ml.performed_at && typeof ml.performed_at === 'string' ? new Date(ml.performed_at) : (ml.performed_at ?? new Date());

                const payload = {
                    company_id: upsertedCompany.id,
                    created_by: newUser,
                    performed_by: newUser,
                    performed_at: parsedPerformedAt,
                    equipment_id: remappedEquipment,
                    case_id: remappedCase,
                    title: (ml.title as string) ?? `Maintenance #${oldId}`,
                    notes: (ml.notes as string | null) ?? null,
                } as unknown as Prisma.maintenance_logsCreateInput;

                const inserted = await prisma.maintenance_logs.create({ data: payload });
                maintenanceLogIdMap[oldId.toString()] = inserted.id;
            }
        }

        // (NFC Tags bereits oben importiert)

        // Backfill history.data_id now that all IDs are known
        if (companyData.history && companyData.history.length > 0) {
            for (const historyItem of companyData.history) {
                const { id: oldId } = historyItem as Omit<history, "updated_at">;
                const newHistId = historyIdMap[oldId.toString()];
                if (!newHistId) continue;
                const tname = (historyItem as unknown as { table_name: string }).table_name;
                const originalId = (historyItem as unknown as { data_id: bigint }).data_id;
                let mappedId: bigint | undefined;
                switch (tname) {
                    case 'articles': mappedId = articleIdMap[originalId?.toString()]; break;
                    case 'equipments': mappedId = equipmentIdMap[originalId?.toString()]; break;
                    case 'locations': mappedId = locationIdMap[originalId?.toString()]; break;
                    case 'contacts': mappedId = contactIdMap[originalId?.toString()]; break;
                    case 'jobs': mappedId = jobIdMap[originalId?.toString()]; break;
                    case 'asset_tags': mappedId = assetTagIdMap[originalId?.toString()]; break;
                    case 'cases': mappedId = caseIdMap[originalId?.toString()]; break;
                    case 'workshop_todos': mappedId = workshopTodoIdMap[originalId?.toString()]; break;
                    case 'maintenance_logs': mappedId = maintenanceLogIdMap[originalId?.toString()]; break;
                    default: mappedId = undefined; break;
                }
                if (mappedId) {
                    await prisma.history.update({
                        where: { id: newHistId },
                        data: { data_id: mappedId }
                    });
                }
            }
        }

        return upsertedCompany;
    });
}
