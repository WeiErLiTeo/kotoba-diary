// Cloudflare Workers 主入口
import { handleLogin } from './api/login.js';
import { handleData } from './api/data.js';
import { handleUpload } from './api/upload.js';

// 验证 Token 的辅助函数
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

// CORS 响应头
function addCORSHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(response.body, { ...response, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    try {
      // 处理 OPTIONS 预检请求
      if (method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          }
        });
      }

      // API 路由
      if (pathname.startsWith("/api/login")) {
        const response = await handleLogin(request, env);
        return addCORSHeaders(response);
      }

      if (pathname.startsWith("/api/data")) {
        const response = await handleData(request, env, verifyToken);
        return addCORSHeaders(response);
      }

      if (pathname.startsWith("/api/upload")) {
        const response = await handleUpload(request, env, verifyToken);
        return addCORSHeaders(response);
      }

      // 静态资源处理 (包括 index.html)
      const staticResponse = await env.ASSETS.fetch(request);
      return addCORSHeaders(staticResponse);

    } catch (error) {
      console.error("Error:", error);
      const response = new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
      return addCORSHeaders(response);
    }
  }
};
