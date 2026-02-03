// 数据读写接口
export async function handleData(request, env, verifyToken) {
  try {
    const method = request.method;

    // GET: 读取数据 (公开)
    if (method === "GET") {
      const value = await env.DIARY_KV.get("data");
      return new Response(value || JSON.stringify({ entries: [], checkins: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // POST: 写入数据 (需要验证 Token)
    if (method === "POST") {
      const isValid = await verifyToken(request, env);
      
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid or missing token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const data = await request.json();
      await env.DIARY_KV.put("data", JSON.stringify(data));
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
