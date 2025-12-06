export async function onRequestGet(context) {
  try {
    const value = await context.env.DIARY_KV.get("data");
    if (!value) {
      return new Response(JSON.stringify({ entries: [], checkins: [] }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(value, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const pass = context.request.headers.get("X-Auth-Pass");
    // 严格模式：必须从环境变量获取，不设默认值
    const correctPass = context.env.DIARY_PASSWORD; 
    
    if (!correctPass || pass !== correctPass) {
      return new Response("Unauthorized", { status: 401 });
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