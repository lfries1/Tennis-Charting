
// src/app/actions.ts
"use server";

import type { DataPoint } from "@/lib/types";

export async function exportDataToSheetsAction(
  data: DataPoint[],
  email: string
): Promise<{ success: boolean; message: string }> {
  const matchDate = new Date().toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  console.log(`Attempting to "email" match report and chart for match played on: ${matchDate} to ${email}`);
  // In a real application, you would structure this data for an email,
  // generate the chart image, and use an email service.
  console.log("Match Data Points:", data);


  if (data.length === 0) {
    return { success: false, message: "No data to email." };
  }
  if (!email || !email.trim()) {
    return { success: false, message: "Email address is required." };
  }

  // Simulate API call delay for sending email
  await new Promise(resolve => setTimeout(resolve, 1500));

  const success = true; 

  if (success) {
    console.log(`Mock email successfully queued for ${email} with ${data.length} data items.`);
    return { success: true, message: `Match report for ${matchDate} will be sent to ${email} (mock).` };
  } else {
    console.error(`Mock email sending failed for ${email} for match on ${matchDate}.`);
    return { success: false, message: `Mock email sending for match on ${matchDate} to ${email} failed.` };
  }
}
