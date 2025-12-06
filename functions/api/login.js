// 这个文件负责：验证密码 -> 生成加密 Token

export async function onRequestPost(context) {
  try {
    const { password } = await context.request.json();
    const correctPass = context.env.DIARY_PASSWORD;

    // 1. 基础检查
    if (!correctPass) {
      return new Response(JSON.stringify({ error: "Server misconfiguration: Password not set" }), { status: 500 });
    }

    // 2. 验证密码 (严格比对)
    if (String(password).trim() !== String(correctPass).trim()) {
      return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 });
    }

    // 3. 生成 Token (使用 HMAC-SHA256 签名)
    // 为了不依赖外部库，我们用 Web Crypto API 做一个简单的签名
    // Token 格式: Base64(Signature).Base64(Timestamp)
    
    const timestamp = Date.now().toString();
    const encoder = new TextEncoder();
    const keyData = encoder.encode(correctPass); // 用密码作为密钥
    const dataToSign = encoder.encode(timestamp);

    const key = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, dataToSign);
    
    // 转 Base64
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const timestampB64 = btoa(timestamp);

    const token = `${signatureB64}.${timestampB64}`;

    return new Response(JSON.stringify({ token: token }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}