const ALLOWED_EMAIL = 'thomdoyley@gmail.com';
const COOKIE_NAME = 'session';
const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

// --- JWT helpers (HMAC-SHA256 via Web Crypto) ---

async function getKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function signJWT(payload, secret) {
  const key = await getKey(secret);
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(sig)}`;
}

async function verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;
    const key = await getKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC', key,
      base64urlDecode(sig),
      new TextEncoder().encode(`${header}.${body}`)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(body)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// --- Cookie helpers ---

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

function setSessionCookie(token, origin) {
  const secure = origin.startsWith('https');
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Lax; Max-Age=${JWT_EXPIRY_SECONDS}`;
}

function clearSessionCookie(origin) {
  const secure = origin.startsWith('https');
  return `${COOKIE_NAME}=; Path=/; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Lax; Max-Age=0`;
}

// --- Auth middleware ---

async function getUser(request, env) {
  const token = getCookie(request, COOKIE_NAME);
  if (!token) return null;
  return verifyJWT(token, env.JWT_SECRET);
}

// --- Route handlers ---

async function handleAuthLogin(request, env) {
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  // Store state in a short-lived KV entry for CSRF protection
  await env.ARTWORK_KV.put(`oauth_state:${state}`, '1', { expirationTtl: 300 });

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email',
    state,
    prompt: 'select_account',
  });
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
}

async function handleAuthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return new Response('Missing code or state', { status: 400 });
  }

  // Verify CSRF state
  const storedState = await env.ARTWORK_KV.get(`oauth_state:${state}`);
  if (!storedState) {
    return new Response('Invalid or expired state parameter', { status: 403 });
  }
  await env.ARTWORK_KV.delete(`oauth_state:${state}`);

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return new Response('Failed to exchange code for token', { status: 500 });
  }

  const tokens = await tokenRes.json();

  // Get user info
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoRes.ok) {
    return new Response('Failed to get user info', { status: 500 });
  }

  const userInfo = await userInfoRes.json();

  // Check email whitelist
  if (userInfo.email !== ALLOWED_EMAIL) {
    return new Response('Access denied. This account is not authorized.', { status: 403 });
  }

  // Create JWT session
  const jwt = await signJWT({
    email: userInfo.email,
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY_SECONDS,
  }, env.JWT_SECRET);

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/upload',
      'Set-Cookie': setSessionCookie(jwt, url.origin),
    },
  });
}

async function handleAuthMe(request, env) {
  const user = await getUser(request, env);
  if (!user) {
    return Response.json({ authenticated: false });
  }
  return Response.json({ authenticated: true, email: user.email });
}

async function handleAuthLogout(request, env) {
  const url = new URL(request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': clearSessionCookie(url.origin),
    },
  });
}

async function handleGetArtworks(env) {
  const data = await env.ARTWORK_KV.get('artworks', 'json');
  return Response.json(data || []);
}

async function handleGetImage(key, env) {
  const object = await env.ARTWORK_BUCKET.get(key);
  if (!object) {
    return new Response('Image not found', { status: 404 });
  }
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

async function handleUpload(request, env) {
  const user = await getUser(request, env);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check content length
  const contentLength = parseInt(request.headers.get('Content-Length') || '0');
  if (contentLength > MAX_UPLOAD_SIZE) {
    return Response.json({ error: 'File too large (max 10MB)' }, { status: 413 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('image');
  const title = formData.get('title');
  const year = formData.get('year');

  if (!file || !title || !year) {
    return Response.json({ error: 'Missing required fields: image, title, year' }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return Response.json({ error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}` }, { status: 400 });
  }

  // Validate file size (double-check after parsing)
  if (file.size > MAX_UPLOAD_SIZE) {
    return Response.json({ error: 'File too large (max 10MB)' }, { status: 413 });
  }

  // Sanitize inputs
  const sanitizedTitle = String(title).trim().slice(0, 200);
  const sanitizedYear = String(year).trim().slice(0, 4);

  if (!sanitizedTitle || !sanitizedYear) {
    return Response.json({ error: 'Title and year cannot be empty' }, { status: 400 });
  }

  // Generate image key
  const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
  const imageKey = `${crypto.randomUUID()}.${ext}`;

  // Upload image to R2
  await env.ARTWORK_BUCKET.put(imageKey, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  // Create artwork entry
  const id = crypto.randomUUID();
  const artwork = {
    id,
    title: sanitizedTitle,
    year: sanitizedYear,
    imageKey,
    alt: sanitizedTitle,
  };

  // Append to KV artworks array
  const existing = await env.ARTWORK_KV.get('artworks', 'json') || [];
  existing.push(artwork);
  await env.ARTWORK_KV.put('artworks', JSON.stringify(existing));

  return Response.json({ success: true, artwork });
}

// --- Main router ---

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API routes
    if (path.startsWith('/api/')) {
      if (path === '/api/auth/login' && request.method === 'GET') {
        return handleAuthLogin(request, env);
      }
      if (path === '/api/auth/callback' && request.method === 'GET') {
        return handleAuthCallback(request, env);
      }
      if (path === '/api/auth/me' && request.method === 'GET') {
        return handleAuthMe(request, env);
      }
      if (path === '/api/auth/logout' && request.method === 'POST') {
        return handleAuthLogout(request, env);
      }
      if (path === '/api/artworks' && request.method === 'GET') {
        return handleGetArtworks(env);
      }
      if (path.startsWith('/api/images/') && request.method === 'GET') {
        const key = decodeURIComponent(path.replace('/api/images/', ''));
        if (!key || key.includes('/') || key.includes('..')) {
          return new Response('Invalid image key', { status: 400 });
        }
        return handleGetImage(key, env);
      }
      if (path === '/api/upload' && request.method === 'POST') {
        return handleUpload(request, env);
      }
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Serve static assets (React SPA)
    // Try the requested path first; if not found, fall back to index.html
    // so React Router can handle client-side routes like /upload
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !path.includes('.')) {
      return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    }
    return response;
  },
};
