// Cloudflare Pages Function - Data Handler
// This handles reading and writing the diary JSON data to Cloudflare KV

export async function onRequestGet(context) {
  // Reading data
  try {
    const value = await context.env.DIARY_KV.get("data");
    if (!value) {
      return new Response(JSON.stringify({ entries: [], checkins: [] }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(value, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  // Saving data
  try {
    // Basic password check (Replace '1234' with an environment variable for better security if you want)
    const pass = context.request.headers.get("X-Auth-Pass");
    // You can set DIARY_PASSWORD in Cloudflare Dashboard -> Settings -> Environment Variables
    const correctPass = context.env.DIARY_PASSWORD || "1234"; 
    
    if (pass !== correctPass) {
      return new Response("Unauthorized", { status: 401 });
    }

    const data = await context.request.json();
    
    // Save to KV
    await context.env.DIARY_KV.put("data", JSON.stringify(data));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}