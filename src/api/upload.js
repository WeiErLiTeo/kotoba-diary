// 文件上传接口
export async function handleUpload(request, env, verifyToken) {
  try {
    const method = request.method;
    const url = new URL(request.url);
    const imageId = url.searchParams.get("id");

    // GET: 获取已上传的图片
    if (method === "GET") {
      if (!imageId) {
        return new Response(JSON.stringify({ error: "Missing image id" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const imageData = await env.DIARY_KV.get(`img:${imageId}`);
      if (!imageData) {
        return new Response(JSON.stringify({ error: "Image not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 返回 Base64 data URL
      return new Response(JSON.stringify({ data: imageData }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // PUT: 上传新图片 (需要验证 Token)
    if (method === "PUT") {
      const isValid = await verifyToken(request, env);
      
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) {
        return new Response(JSON.stringify({ error: "No file provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const arrayBuffer = await file.arrayBuffer();
      const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:${file.type};base64,${base64String}`;
      const id = crypto.randomUUID();
      
      await env.DIARY_KV.put(`img:${id}`, dataUrl);
      const imageUrl = `/api/upload?id=${id}`;
      
      return new Response(JSON.stringify({ url: imageUrl, id: id }), {
        status: 201,
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
