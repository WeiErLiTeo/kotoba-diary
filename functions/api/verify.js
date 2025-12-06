// Cloudflare Pages Function - Password Verifier
// 这个文件专门用来验证密码，不涉及读写数据

export async function onRequestGet(context) {
  try {
    // 获取前端传来的密码
    const pass = context.request.headers.get("X-Auth-Pass");
    // 获取你在后台设置的正确密码 (如果没设则是 1234)
    const correctPass = context.env.DIARY_PASSWORD || "1234";
    
    // 比对密码
    if (pass === correctPass) {
      // 密码正确，返回 200 OK
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      // 密码错误，返回 401 Unauthorized
      return new Response(JSON.stringify({ success: false }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}