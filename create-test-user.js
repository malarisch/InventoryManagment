const { createAdminClient } = require('./lib/supabase/admin');

async function createTestUser() {
  const adminClient = createAdminClient();
  
  // Create user
  const { data: user, error } = await adminClient.auth.admin.createUser({
    email: 'test@test.com',
    password: 'password123',
    email_confirm: true
  });
  
  if (error) {
    console.error('Error creating user:', error);
    return;
  }
  
  console.log('User created:', user.user?.id, user.user?.email);
  
  // Create company for user
  const { data: company, error: companyError } = await adminClient
    .from('companies')
    .insert({
      name: 'Test Company',
      description: 'Test company for debugging',
      owner_user_id: user.user?.id
    })
    .select()
    .single();
  
  if (companyError) {
    console.error('Error creating company:', companyError);
    return;
  }
  
  console.log('Company created:', company.id, company.name);
  
  // Add user to company
  const { error: memberError } = await adminClient
    .from('users_companies')
    .insert({
      user_id: user.user?.id,
      company_id: company.id
    });
  
  if (memberError) {
    console.error('Error adding user to company:', memberError);
    return;
  }
  
  console.log('User added to company successfully');
}

createTestUser().catch(console.error);