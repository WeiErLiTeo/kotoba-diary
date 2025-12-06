// Cloudflare Pages Function - Password Verifier
// 这个文件专门用来验证密码

export async function onRequestGet(context) {
  try {
    const pass = context.request.headers.get("X-Auth-Pass");
    // 你的环境变量是 DIARY_PASSWORD，如果没有设置，默认为 1234
    const correctPass = context.env.DIARY_PASSWORD || "1234";
    
    // 强制把密码都转成字符串去除空格比对，防止意外
    if (String(pass).trim() === String(correctPass).trim()) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ success: false }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}