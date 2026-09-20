const TIMEOUT = 10000; // 10 detik
const MAX_BATCH_SIZE = 10;

async function checkProxy(proxyString) {
  let proxy = proxyString;
  let port = 443;
  
  if (proxyString.includes(':')) {
    const parts = proxyString.split(':');
    proxy = parts[0];
    port = parseInt(parts[1], 10) || 443;
  }
  
  if (!proxy) {
    return { error: "mana proxynya?", proxyip: false };
  }
  
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    // Kirim request ke target IP/proxy dengan menyamarkan Host Header
    const targetUrl = `https://${proxy}:${port}/meta`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Host': 'speed.cloudflare.com',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://speed.cloudflare.com/',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const delay = Date.now() - startTime;
    
    if (response.ok) {
      const resText = await response.text();
      const data = JSON.parse(resText);
      const clientIp = data.clientIp;
      
      if (clientIp) {
        const result = {
          proxy: proxy,
          port: String(port),
          proxyip: true,
          ip: clientIp,
          delay: `${delay} ms`
        };
        
        // Ambil data geo/informasi tambahan dari Cloudflare meta
        for (const [k, v] of Object.entries(data)) {
          if (k !== 'clientIp') result[k] = v;
        }
        return result;
      } else {
        return { proxy, port: String(port), proxyip: false, delay: `${delay} ms`, error: "No clientIp in response" };
      }
    } else {
      return { proxy, port: String(port), proxyip: false, delay: `${delay} ms`, error: `HTTP ${response.status}` };
    }
    
  } catch (err) {
    const delay = Date.now() - startTime;
    return {
      proxy,
      port: String(port),
      proxyip: false,
      delay: `${delay} ms`,
      error: err.name === 'AbortError' ? 'Timeout' : err.message
    };
  }
}

// Handler utama EdgeOne Pages Function
// Endpoint ini otomatis bisa diakses di: /api/check
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const ipParam = url.searchParams.get('ip') || '';
  
  if (!ipParam) {
    return new Response(JSON.stringify({ error: "mana proxynya? pakai ?ip=ip:port,ip:port" }), {
      status: 400,
      headers: { 
        'content-type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Parsing list proxy dari koma atau baris baru
  const proxyList = ipParam.split(',').map(s => s.strip ? s.strip() : s.trim()).filter(Boolean);
  const limitedProxies = proxyList.slice(0, MAX_BATCH_SIZE);
  
  // Eksekusi secara concurrent/paralel menggunakan Promise.all
  const results = await Promise.all(limitedProxies.map(p => checkProxy(p)));
  
  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 
      'content-type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
