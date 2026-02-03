// 登录接口
export async function handleLogin(request, env) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { password } = await request.json();
    const correctPass = env.DIARY_PASSWORD;

    // 1. 基础检查
    if (!correctPass) {
      return new Response(JSON.stringify({ error: "Server misconfiguration: Password not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 验证密码 (严格比对)
    if (String(password).trim() !== String(correctPass).trim()) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. 生成 Token (使用 HMAC-SHA256 签名)
    const timestamp = Date.now().toString();
    const encoder = new TextEncoder();
    const keyData = encoder.encode(correctPass);
    const dataToSign = encoder.encode(timestamp);

    const key = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, dataToSign);
    
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const timestampB64 = btoa(timestamp);
    const token = `${signatureB64}.${timestampB64}`;

    return new Response(JSON.stringify({ token: token }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
