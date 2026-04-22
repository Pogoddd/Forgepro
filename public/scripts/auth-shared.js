(function(){
  const AUTH_SESSION_KEY = 'forgepro_auth_session_v1';
  const AUTH_USER_KEY = 'forgepro_auth_user_v1';

  function normalizePath(nextPath){
    if(!nextPath || typeof nextPath !== 'string') return '/';
    if(!nextPath.startsWith('/')) return '/';
    return nextPath;
  }

  function buildAuthUrl(nextPath){
    const target = normalizePath(nextPath || '/');
    return `/auth.html?next=${encodeURIComponent(target)}`;
  }

  function getRedirectTarget(search){
    const params = new URLSearchParams(search || window.location.search);
    return normalizePath(params.get('next') || '/');
  }

  function normalizeAuthUser(user){
    if(!user) return null;
    return {
      uid: user.uid || '',
      email: user.email || '',
      displayName: user.displayName || '',
      provider: user.providerData?.[0]?.providerId || 'password',
      emailVerified: Boolean(user.emailVerified),
      ts: Date.now(),
    };
  }

  function saveAuthSession(user){
    const payload = normalizeAuthUser(user);
    if(!payload) return null;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(payload));
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload));
    return payload;
  }

  function clearAuthSession(){
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  function getStoredAuthUser(){
    try{
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(err){
      return null;
    }
  }

  function hasStoredAuthSession(){
    try{
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if(!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed && parsed.uid);
    }catch(err){
      return false;
    }
  }

  window.ForgeAuth = {
    AUTH_SESSION_KEY,
    AUTH_USER_KEY,
    buildAuthUrl,
    getRedirectTarget,
    normalizeAuthUser,
    saveAuthSession,
    clearAuthSession,
    getStoredAuthUser,
    hasStoredAuthSession,
  };
})();
