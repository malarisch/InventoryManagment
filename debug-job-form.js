// Debug script to check what's happening with job form submission
// Run in browser console

console.log('Current URL:', window.location.href);

const form = document.querySelector('form');
if (form) {
  console.log('Form found:', form);
  console.log('Form action:', form.action);
  console.log('Form method:', form.method);
  
  const submitButton = form.querySelector('button[type="submit"]');
  console.log('Submit button found:', submitButton);
  console.log('Submit button disabled:', submitButton?.disabled);
  
  // Check form data
  const formData = new FormData(form);
  console.log('Form data:');
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  
  // Check for error messages
  const errorElements = document.querySelectorAll('.text-red-600, .text-red-500, .error');
  console.log('Error elements:', errorElements);
  
  // Try to manually trigger submit
  console.log('Attempting manual form submission...');
  form.requestSubmit();
} else {
  console.log('No form found!');
}