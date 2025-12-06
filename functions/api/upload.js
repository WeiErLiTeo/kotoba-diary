export async function onRequestPut(context) {
  try {
    const pass = context.request.headers.get("X-Auth-Pass");
    // 严格模式
    const correctPass = context.env.DIARY_PASSWORD;
    
    if (!correctPass || pass !== correctPass) {
      return new Response("Unauthorized", { status: 401 });
    }

    const formData = await context.request.formData();
    const file = formData.get('file');

    if (!file) return new Response("No file uploaded", { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:${file.type};base64,${base64String}`;
    const id = crypto.randomUUID();
    
    await context.env.DIARY_KV.put(`img:${id}`, dataUrl);

    const url = `/api/upload?id=${id}`;
    
    return new Response(JSON.stringify({ url: url }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing ID", { status: 400 });

    const value = await context.env.DIARY_KV.get(`img:${id}`);
    if (!value) return new Response("Not found", { status: 404 });

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