// 验证 Token 的辅助函数
async function verifyToken(req, env) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  
  const token = authHeader.split(" ")[1];
  const [signatureB64, timestampB64] = token.split(".");
  if (!signatureB64 || !timestampB64) return false;

  const correctPass = env.DIARY_PASSWORD;
  if (!correctPass) return false;

  // 重建签名进行比对
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

export async function onRequestGet(context) {
  // 读数据不需要高强度验证，公开也没事，或者你可以加上verifyToken
  const value = await context.env.DIARY_KV.get("data");
  return new Response(value || JSON.stringify({ entries: [], checkins: [] }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  try {
    // >>> 关键修改：验证 Token <<<
    const isValid = await verifyToken(context.request, context.env);
    
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid or missing token" }), { status: 401 });
    }

    const data = await context.request.json();
    await context.env.DIARY_KV.put("data", JSON.stringify(data));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}