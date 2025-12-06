// Cloudflare Pages Function - Image Upload Handler
// Stores images directly in KV (Simple solution for small projects)

export async function onRequestPut(context) {
  try {
    const pass = context.request.headers.get("X-Auth-Pass");
    const correctPass = context.env.DIARY_PASSWORD || "1234";
    
    if (pass !== correctPass) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get the file from form data
    const formData = await context.request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response("No file uploaded", { status: 400 });
    }

    // Convert file to ArrayBuffer then to Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:${file.type};base64,${base64String}`;

    // Create a unique ID for the image
    const id = crypto.randomUUID();
    
    // Save to KV. Expiration is optional (TTL). Here we keep it forever.
    // Note: KV has limits. For heavy production, use R2. But for this demo, KV is fine.
    await context.env.DIARY_KV.put(`img:${id}`, dataUrl);

    // Return the URL that the frontend can use to display it
    // Note: Since we saved the full Data URL string, we can't just serve it as a raw file easily
    // without another endpoint. 
    // Wait! The frontend code expects a URL.
    // To keep it simple for "drag and drop" without complex routing:
    // We will just return the Data URL directly if it's small, 
    // OR we modify the frontend to store the Data URL string in the JSON.
    //
    // ACTUALLY: The best way for your React code:
    // We return a "virtual" URL, and we need an endpoint to serve it?
    // No, let's just return the Data URL directly to the frontend to save in the JSON.
    // That way we don't need a separate serve endpoint.
    // BUT: Data URLs are huge in JSON. 
    //
    // Let's stick to the "Store in KV, serve via endpoint" method.
    // We need a GET handler in this same file or another.
    
    // Let's simplify: return the endpoint URL that serves this image.
    const url = `/api/upload?id=${id}`;
    
    return new Response(JSON.stringify({ url: url }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Handler to SERVE the image
export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id) return new Response("Missing ID", { status: 400 });

    const value = await context.env.DIARY_KV.get(`img:${id}`);
    
    if (!value) return new Response("Not found", { status: 404 });

    // The value stored is a Data URL (e.g., "data:image/png;base64,.....")
    // We need to parse it to serve it as an image file
    const parts = value.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new Response(u8arr, {
        headers: { "Content-Type": mime }
    });
}