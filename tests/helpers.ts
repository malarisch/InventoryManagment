import 'dotenv/config';
import {
    equipmentsCreateNestedManyWithoutArticlesInput,
    equipmentsUncheckedCreateWithoutArticlesInput,
    Prisma,
    PrismaClient
} from '@/lib/generated/prisma';
import {ArticleMetadata, EquipmentMetadata} from "@/components/metadataTypes.types";

function genArticle({companyId, userid}: {companyId: number, userid: string}): object {

    return {
        name: "Test Article + #" + Date.now(),
        description: "This is a test article",
        metadata: {
            type: "Article Test Type",
            is19Inch: false,


        } as ArticleMetadata,
        created_by: userid,
        company_id: companyId,

    }
}

function genLocation({companyId, userid}: {companyId: number, userid: string}) {
    return {
        name: "Test Location + #" + Date.now(),
        description: "This is a test location",
        metadata: {
            isWorkshop: false,
        },
        created_by: userid,
        company_id: companyId,
    }
}


function genEquipment({companyId, userid, sn }: {companyId: number, userid: string, sn?: number}): equipmentsUncheckedCreateWithoutArticlesInput {
    return {
        created_by: userid,
        company_id: companyId,
        metadata: {
            SerialNo: sn,
        } as EquipmentMetadata,
    }
}



// Use a single PrismaClient instance across tests
const prisma = new PrismaClient();

export async function getCompanyAndUserId(companyName: string) {
  const company = await prisma.companies.findFirst({
    where: { name: companyName },
    select: { id: true, owner_user_id: true },
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

  return { companyId: Number(company.id), userId };
}

export async function createCustomer(companyName: string): Promise<number> {
  // Create a test customer for jobs
  const ids = await getCompanyAndUserId(companyName);
  if (!ids) throw new Error('Cannot create customer without valid companyId and userId');
  const { companyId, userId } = ids;
  const timestamp = Date.now();

  const customer = await prisma.customers.create({
    data: {
      type: 'personal',
      forename: 'Test',
      surname: `Customer ${timestamp}`,
      email: `customer${timestamp}@example.com`,
      company_id: BigInt(companyId),
      created_by: userId,
    },
    select: { id: true },
  });

  return Number(customer.id);
}


export async function createArticle(companyName: string, options : {createEquipments: 0, createLocation: false}) {
    const ids = await getCompanyAndUserId(companyName);
    if (!ids) throw new Error('Cannot create article without valid companyId and userId');
    const { companyId, userId } = ids;

    const articleData = genArticle({companyId, userid: userId}) as Prisma.articlesCreateInput;
    const eqs = [] as equipmentsCreateNestedManyWithoutArticlesInput[];
    if (options.createEquipments > 0) {

        for (let i = 0; i < options.createEquipments; i++) {
            eqs.push(genEquipment({companyId, userid: userId, sn: i}))
        }
        articleData.equipments = [...eqs] as Prisma.equipmentsCreateNestedManyWithoutArticlesInput;
    }
    let location = null;
    if (options.createLocation) {
        location = await prisma.locations.create({data: genLocation({companyId, userid: userId})})
    }
    const article = await prisma.articles.create({
      data: {...articleData, default_location: location.id || null},
      select: { id: true },
    });

    return Number(article.id);
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
