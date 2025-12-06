export async function onRequestGet(context) {
  try {
    const pass = context.request.headers.get("X-Auth-Pass");
    
    // 获取后台环境变量。如果没有设置，correctPass 就是 undefined
    const correctPass = context.env.DIARY_PASSWORD;
    
    // 安全检查：如果后台没设置密码，或者前端没发密码，直接拒绝
    if (!correctPass || !pass) {
        return new Response(JSON.stringify({ success: false, error: "Password not configured or missing" }), { 
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }
    
    // 严格比对
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