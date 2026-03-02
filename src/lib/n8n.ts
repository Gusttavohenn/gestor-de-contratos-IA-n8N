// src/lib/n8n.ts
export const triggerN8NWorkflow = async (data: any) => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        origin: 'Minas Port Docs App'
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Erro ao chamar n8n:", error);
  }
};