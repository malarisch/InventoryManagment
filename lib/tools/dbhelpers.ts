import 'dotenv/config';
import {Prisma, PrismaClient} from '@/lib/generated/prisma';
import {
    adminCompanyMetadata,
    ArticleMetadata,
    asset_tag_template_print,
} from "@/components/metadataTypes.types";
import {AssetTagEntityType, buildAssetTagCode} from "@/lib/asset-tags/code";

function genArticle({companyId, userid}: {companyId: number, userid: string}): Prisma.articlesUncheckedCreateInput {

    return {
        name: "Test Article + #" + Date.now(),

        metadata: {
            description: "This is a test article",
            type: "Article Test Type",
            is19Inch: false,


    } as ArticleMetadata as unknown as Prisma.InputJsonValue,
    created_by: userid,
    company_id: BigInt(companyId),

    }
}

function genLocation({companyId, userid}: {companyId: number, userid: string}) {
    return {
        name: "Test Location + #" + Date.now(),
        description: "This is a test location",
        created_by: userid,
        company_id: companyId,
    }
}


function genEquipment({companyId, userid, sn }: {companyId: number, userid: string, sn?: number}): Prisma.equipmentsCreateManyArticlesInput {
    return {
        created_by: userid,
        company_id: BigInt(companyId),
        metadata: {
            SerialNo: sn,
        } as unknown as Prisma.InputJsonValue,
    };
}



// Use a single PrismaClient instance across tests
const prisma = new PrismaClient();

export async function getCompanyAndUserId(companyName: string) {
  const company = await prisma.companies.findFirst({
    where: { name: companyName },
    select: { id: true, owner_user_id: true, metadata: true },
  });

  if (!company) {
    console.error('Company not found:', companyName);
    return null;
  }
  const userId = company.owner_user_id ?? undefined;
  if (!userId) {
    console.error('No owner_user_id for company:', companyName);
    return null;
  }

  return { companyId: Number(company.id), userId, companyMeta: company.metadata };
}

export async function createCustomer(companyName: string): Promise<number> {
  // Create a test customer contact for jobs
  const ids = await getCompanyAndUserId(companyName);
  if (!ids) throw new Error('Cannot create contact without valid companyId and userId');
  const { companyId, userId } = ids;
  const timestamp = Date.now();

  const contact = await prisma.contacts.create({
    data: {
      contact_type: 'customer',
      customer_type: 'private',
      forename: 'Test',
      surname: `Customer ${timestamp}`,
      first_name: 'Test',
      last_name: `Customer ${timestamp}`,
      display_name: `Test Customer ${timestamp}`,
      email: `customer${timestamp}@example.com`,
      company_id: BigInt(companyId),
      created_by: userId,
    },
    select: { id: true },
  });

  return Number(contact.id);
}
export async function articleMock(companyName: string, options : {createEquipments: number, createLocation: boolean} = {createEquipments: 0, createLocation: false}) {
    const ids = await getCompanyAndUserId(companyName);
    if (!ids) throw new Error('Cannot create article without valid companyId and userId');
    const { companyId, userId } = ids;

    const articleData = genArticle({companyId, userid: userId});
    const eqs: Prisma.equipmentsCreateManyArticlesInput[] = [];
    if (options.createEquipments > 0) {
        for (let i = 0; i < options.createEquipments; i++) {
            eqs.push(genEquipment({companyId, userid: userId, sn: i}));
        }
        // Use nested createMany to attach equipments to this article
        (articleData as Prisma.articlesUncheckedCreateInput).equipments = {
            createMany: { data: eqs }
        } as Prisma.equipmentsCreateNestedManyWithoutArticlesInput;
    }
    let location = null;
    if (options.createLocation) {
        location = await prisma.locations.create({data: genLocation({companyId, userid: userId})})
    }
        return { location,
            ...await prisma.articles.create({
                    data: {
                        ...articleData,
                        default_location: location ? BigInt(location.id) : null,
                    },
            select: { id: true, name: true, equipments: { select: { id: true, metadata: true } }, default_location: true}
        }
    )
}
}

export async function createArticle(companyName: string, options : {createEquipments: number, createLocation: boolean} = {createEquipments: 0, createLocation: false}): Promise<number> {
    const article = await articleMock(companyName, options);

    return Number(article.id);
}


export async function createAssetTagTemplate(companyName: string) {
    const ids = await getCompanyAndUserId(companyName);
    if (!ids) throw new Error('Cannot create asset tag template without valid companyId and userId');
    const { companyId, userId } = ids;
    return prisma.asset_tag_templates.create({
        data: {
            company_id: BigInt(companyId),
            created_by: userId,
            template: {
                "name": "Test Template",
                "prefix": "TEST",
                "suffix": "",
                "codeType": "QR",
                "elements": [{
                    "x": 70.76,
                    "y": 3.47,
                    "size": 90,
                    "type": "qrcode",
                    "color": "#000000",
                    "value": "{printed_code}"
                }, {
                    "x": 64.05,
                    "y": 41.08,
                    "size": 12,
                    "type": "text",
                    "color": "#000000",
                    "value": "CODE: {printed_code}"
                }, {
                    "x": 1,
                    "y": 33,
                    "size": 12,
                    "type": "text",
                    "color": "#000000",
                    "value": "EQ NAME: {equipment_name}"
                }, {
                    "x": 1,
                    "y": 23.69,
                    "size": 12,
                    "type": "text",
                    "color": "#000000",
                    "value": "ART NAME: {article_name}"
                }, {
                    "x": 1,
                    "y": 8.67,
                    "size": 12,
                    "type": "text",
                    "color": "#000000",
                    "value": "LOC NAME: {location_name}"
                }],
                "marginMm": 2,
                "textColor": "#000000",
                "codeSizeMm": 15,
                "tagWidthMm": 100,
                "textSizePt": 12,
                "borderColor": "#ffffff",
                "description": "",
                "tagHeightMm": 50,
                "isMonochrome": false,
                "numberLength": 4,
                "borderWidthMm": 0,
                "stringTemplate": "",
                "backgroundColor": "#ffffff",
                "numberingScheme": "sequential"
            }

        }
    })
}


export async function createAssetTag(companyName: string, code: string, assetType: AssetTagEntityType, templateId: number, applied: false) {
    const ids = await getCompanyAndUserId(companyName);
    if (!ids) throw new Error('Cannot create asset tag template without valid companyId and userId');
    const { companyId, userId, companyMeta } = ids;
    let template;
    if (companyMeta) {
        template = await prisma.asset_tag_templates.findFirst({
            where: {
                company_id: BigInt(companyId),
                id: BigInt(templateId)
            }
        });
    }
    return prisma.asset_tags.create({
        data: {
            company_id: BigInt(companyId),
            created_by: userId,
            printed_code: companyMeta? buildAssetTagCode(companyMeta as unknown as adminCompanyMetadata, assetType, parseInt(code), template! as unknown as asset_tag_template_print) : code,
            printed_template: BigInt(templateId),
            printed_applied: applied
        }
    });
}

export async function createEquipment(companyName: string): Promise<number> {
  const ids = await getCompanyAndUserId(companyName);
  if (!ids) throw new Error('Cannot create equipment without valid companyId and userId');
  const { companyId, userId } = ids;

  // Minimal required fields according to prisma/schema.prisma
  const equipment = await prisma.equipments.create({
    data: {
      company_id: BigInt(companyId),
      created_by: userId,
    },
    select: { id: true },
  });

  return Number(equipment.id);
}

/**
 * Retrieves a user's ID by email via profiles table.
 * Falls back to `profiles.email` since `auth.users` is not in Prisma schema.
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
  const profile = await prisma.profiles.findFirst({
    where: { email },
    select: { id: true },
  });
  return profile?.id ?? null;
}
