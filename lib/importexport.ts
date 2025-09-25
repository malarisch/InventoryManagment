import {
    Prisma,
    PrismaClient,
    locations,
    asset_tag_templates,
    articles,
    equipments,
    customers,
    jobs,
    job_assets_on_job,
    job_booked_assets,
    asset_tags,
    nfc_tags,
    history,
    cases,
    companies,
    users_companies,
    profiles
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
            customers: true,
            jobs: true,
            job_assets_on_job: true,
            job_booked_assets: true,
            nfc_tags: true,
            asset_tags: true,
            history: true


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
            customers: _customers,
            jobs: _jobs,
            job_assets_on_job: _job_assets_on_job,
            job_booked_assets: _job_booked_assets,
            asset_tags: _asset_tags,
            nfc_tags: _nfc_tags,
            history: _history,
            cases: _cases,
            locations: _locations,
            asset_tag_templates: _asset_tag_templates,
            ...companyInfo
        } = companyData as Omit<companies, "updated_at"> & {
            articles: articles[],
            equipments: equipments[],
            customers: customers[],
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
        };


        const existingCompany = await prisma.companies.findFirst({
            where: {
                name: companyInfo.name,
                owner_user_id: newUser,
            }
        });

        let upsertedCompany;
        if (existingCompany) {
            upsertedCompany = await prisma.companies.update({
                where: {id: existingCompany.id},
                data: {
                    ...companyInfo,
                    metadata: companyInfo.metadata ?? Prisma.JsonNull,
                    files: companyInfo.files ?? Prisma.JsonNull,
                },
            });
        } else {
            upsertedCompany = await prisma.companies.create({
                data: {
                    ...companyInfo,
                    owner_user_id: newUser,
                    metadata: companyInfo.metadata ?? Prisma.JsonNull,
                    files: companyInfo.files ?? Prisma.JsonNull,
                },
            });
        }


        await prisma.users_companies.create({
            data: {
                company_id: upsertedCompany.id,
                user_id: newUser,
            }
        })

        const companyIdMap: Record<string, bigint> = {};
        companyIdMap[companyData.id.toString()] = upsertedCompany.id;


        // IDs für verschiedene Entitäten speichern
        const profileIdMap: Record<string, string> = {};
        const locationIdMap: Record<string, bigint> = {};
        const articleIdMap: Record<string, bigint> = {};
        const equipmentIdMap: Record<string, bigint> = {};
        const customerIdMap: Record<string, bigint> = {};
        const jobIdMap: Record<string, bigint> = {};
        const assetTagIdMap: Record<string, bigint> = {};

        // Profile importieren
        if (companyData.profiles) {
            const profile = companyData.profiles;
            const {id: oldId} = profile;
            profileIdMap[oldId] = newUser;
        }

        // Locations importieren
        if (companyData.locations && companyData.locations.length > 0) {
            for (const location of companyData.locations) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    ...locationData
                } = location as Omit<locations, "updated_at">;
                locationData.company_id = upsertedCompany.id;

                const newLocation = await prisma.locations.create({
                    data: {
                        ...locationData,
                        files: locationData.files ?? Prisma.JsonNull
                    }
                });
                locationIdMap[oldId.toString()] = newLocation.id;
            }
        }

        // Asset Tag Templates importieren
        if (companyData.asset_tag_templates && companyData.asset_tag_templates.length > 0) {
            for (const template of companyData.asset_tag_templates) {
                const {
                    id: _id,
                    created_at: _createdAt,
                    ...templateData
                } = template as Omit<asset_tag_templates, "updated_at">;
                templateData.company_id = upsertedCompany.id;

                await prisma.asset_tag_templates.create({
                    data: {
                        ...templateData,
                        template: templateData.template ?? Prisma.JsonNull
                    }
                });
            }
        }

        // Artikel importieren
        if (companyData.articles && companyData.articles.length > 0) {
            for (const article of companyData.articles) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    ...articleData
                } = article as Omit<articles, "updated_at">;
                articleData.company_id = upsertedCompany.id;

                const newArticle = await prisma.articles.create({
                    data: {
                        ...articleData,
                        metadata: articleData.metadata ?? Prisma.JsonNull,
                        files: articleData.files ?? Prisma.JsonNull,
                    }
                });
                articleIdMap[oldId.toString()] = newArticle.id;
            }
        }

        // Equipment importieren
        if (companyData.equipments && companyData.equipments.length > 0) {
            for (const equipment of companyData.equipments) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    ...equipmentData
                } = equipment as Omit<equipments, "updated_at">;
                equipmentData.company_id = upsertedCompany.id;

                // Artikel-ID aktualisieren, falls vorhanden
                if (equipmentData.article_id && articleIdMap[equipmentData.article_id.toString()]) {
                    equipmentData.article_id = articleIdMap[equipmentData.article_id.toString()];
                }

                const newEquipment = await prisma.equipments.create({
                    data: {
                        ...equipmentData,
                        metadata: equipmentData.metadata ?? Prisma.JsonNull,
                        files: equipmentData.files ?? Prisma.JsonNull,
                    }
                });
                equipmentIdMap[oldId.toString()] = newEquipment.id;
            }
        }

        // Kunden importieren
        if (companyData.customers && companyData.customers.length > 0) {
            for (const customer of companyData.customers) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    ...customerData
                } = customer as Omit<customers, "updated_at">;
                customerData.company_id = upsertedCompany.id;

                const newCustomer = await prisma.customers.create({
                    data: {
                        ...customerData,
                        metadata: customerData.metadata ?? Prisma.JsonNull,
                        files: customerData.files ?? Prisma.JsonNull,
                    }
                });
                customerIdMap[oldId.toString()] = newCustomer.id;
            }
        }

        // Jobs importieren
        if (companyData.jobs && companyData.jobs.length > 0) {
            for (const job of companyData.jobs) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    ...jobData
                } = job as Omit<jobs, "updated_at">;
                jobData.company_id = upsertedCompany.id;

                // Kunden-ID aktualisieren
                if (jobData.customer_id && customerIdMap[jobData.customer_id.toString()]) {
                    jobData.customer_id = customerIdMap[jobData.customer_id.toString()];
                }

                const newJob = await prisma.jobs.create({
                    data: {
                        ...jobData,
                        meta: jobData.meta ?? Prisma.JsonNull,
                        files: jobData.files ?? Prisma.JsonNull,
                    }
                });
                jobIdMap[oldId.toString()] = newJob.id;
            }
        }

        // Job Assets on Job importieren
        if (companyData.job_assets_on_job && companyData.job_assets_on_job.length > 0) {
            for (const jobAsset of companyData.job_assets_on_job) {
                const {
                    id: _id,
                    created_at: _createdAt,
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

                await prisma.job_assets_on_job.create({
                    data: jobAssetData
                });
            }
        }

        // Job Booked Assets importieren
        if (companyData.job_booked_assets && companyData.job_booked_assets.length > 0) {
            for (const bookedAsset of companyData.job_booked_assets) {
                const {
                    id: _id,
                    created_at: _createdAt,
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

                await prisma.job_booked_assets.create({
                    data: bookedAssetData
                });
            }
        }

        // Asset Tags importieren
        if (companyData.asset_tags && companyData.asset_tags.length > 0) {
            for (const assetTag of companyData.asset_tags) {
                const {
                    id: oldId,
                    created_at: _createdAt,
                    ...assetTagData
                } = assetTag as Omit<asset_tags, "updated_at">;
                assetTagData.company_id = upsertedCompany.id;

                const newAssetTag = await prisma.asset_tags.create({
                    data: assetTagData
                });
                assetTagIdMap[oldId.toString()] = newAssetTag.id;
            }
        }

        // NFC Tags importieren
        if (companyData.nfc_tags && companyData.nfc_tags.length > 0) {
            for (const nfcTag of companyData.nfc_tags) {
                const {
                    id: _id,
                    created_at: _createdAt,
                    ...nfcTagData
                } = nfcTag as Omit<nfc_tags, "updated_at">;
                nfcTagData.company_id = upsertedCompany.id;

                await prisma.nfc_tags.create({
                    data: nfcTagData
                });
            }
        }

        // History importieren
        if (companyData.history && companyData.history.length > 0) {
            for (const historyItem of companyData.history) {
                const {
                    id: _id,
                    created_at: _createdAt,
                    ...historyData
                } = historyItem as Omit<history, "updated_at">;
                historyData.company_id = upsertedCompany.id;

                await prisma.history.create({
                    data: {
                        ...historyData,
                        old_data: historyData.old_data ?? Prisma.JsonNull
                    }
                });
            }
        }

        // Cases importieren
        if (companyData.cases && companyData.cases.length > 0) {
            for (const caseItem of companyData.cases) {
                const {
                    id: _id,
                    created_at: _createdAt,
                    ...caseData
                } = caseItem as Omit<cases, "updated_at">;
                caseData.company_id = upsertedCompany.id;

                await prisma.cases.create({
                    data: {
                        ...caseData,
                        articles: (caseData.articles as Prisma.InputJsonValue[]) ?? Prisma.JsonNull,
                        files: caseData.files ?? Prisma.JsonNull,
                    }
                });
            }
        }

        return upsertedCompany;
    });
}
