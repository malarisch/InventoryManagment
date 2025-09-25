import 'dotenv/config';
import { createAdminClient } from "@/lib/supabase/admin";


  const admin = createAdminClient();


  export async function getCompanyAndUserId(companyName: string) {
    const { data: companyId, error: error } = await admin.from("companies").select("id, owner_user_id").eq("name", companyName).single();
    if (error) {
      console.error("Error fetching company ID:", error);
      return null;
    }
    const userId = companyId?.owner_user_id;
    if (!userId) {
      console.error("No user ID found for company:", companyName);
      return null;
    }
    return { companyId: companyId.id, userId };
  }


  export async function createCustomer(companyName: string) {
     // Create a test customer for jobs
     const {companyId, userId} = await getCompanyAndUserId(companyName) ?? {};
     if (!companyId || !userId) {
       console.error("Cannot create customer without valid companyId and userId");
       return;
     }
     const timestamp = Date.now();
    const { data: customerData, error: customerError } = await admin
      .from('customers')
      .insert({
        type: 'personal',
        forename: 'Test',
        surname: `Customer ${timestamp}`,
        email: `customer${timestamp}@example.com`,
        company_id: companyId,
        created_by: userId
      })
      .select()
      .single();
    if (customerError) {
      throw customerError;
    }
    const testCustomerId = customerData.id;
    return testCustomerId;
    }
export async function createEquipment(companyName: string) {
  const {companyId, userId} = await getCompanyAndUserId(companyName) ?? {};
  if (!companyId || !userId) {
    console.error("Cannot create equipment without valid companyId and userId");
    return;
  }
  const timestamp = Date.now();
  const { data: typeData, error: typeError } = await admin
    .from('equipments')
    .insert({
      name: `Test Equipment ${timestamp}`,
      company_id: companyId,
      created_by: userId
    })
    .select()
    .single();
  if (typeError) {
    throw typeError;
  }
  const testTypeId = typeData.id;
  return testTypeId;
}

/**
 * Retrieves a user's ID by their email address using a database function.
 * @param {string} email - The email address to look up.
 * @returns {Promise<string | null>} A Promise that resolves to the user's ID, or null if not found.
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
    const { data, error } = await admin.rpc('get_user_id_by_email', { p_email: email });

    if (error) {
        console.error('getUserIdByEmail error', error);
        return null;
    }

    return data;
}