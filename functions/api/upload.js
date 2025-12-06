// 验证 Token 的辅助函数 (重复一遍以保证独立运行)
async function verifyToken(req, env) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  
  const token = authHeader.split(" ")[1];
  const [signatureB64, timestampB64] = token.split(".");
  if (!signatureB64 || !timestampB64) return false;

  const correctPass = env.DIARY_PASSWORD;
  if (!correctPass) return false;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(correctPass);
  const timestampStr = atob(timestampB64);
  const dataToSign = encoder.encode(timestampStr);

  const key = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, dataToSign);
  const expectedSignatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return signatureB64 === expectedSignatureB64;
}

export async function onRequestPut(context) {
  try {
    // >>> 关键修改：验证 Token <<<
    const isValid = await verifyToken(context.request, context.env);
    
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    const formData = await context.request.formData();
    const file = formData.get('file');
    if (!file) return new Response("No file", { status: 400 });

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
    // 图片读取可以是公开的，不需要验证
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing ID", { status: 400 });
    const value = await context.env.DIARY_KV.get(`img:${id}`);
    if (!value) return new Response("Not found", { status: 404 });
    const parts = value.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length; const u8arr = new Uint8Array(n); while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new Response(u8arr, { headers: { "Content-Type": mime } });
}