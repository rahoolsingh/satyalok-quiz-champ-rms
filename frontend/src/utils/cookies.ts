// Cookie utility functions
export const cookies = {
  set: (name: string, value: string, days: number = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  },

  get: (name: string): string | null => {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  delete: (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },
};

// Session-specific helpers
export const sessionCookies = {
  setSession: (token: string, mobile: string, batch: string) => {
    cookies.set('sessionToken', token, 1); // 1 day expiry
    cookies.set('sessionMobile', mobile, 1);
    cookies.set('sessionBatch', batch, 1);
  },

  getSession: () => {
    const token = cookies.get('sessionToken');
    const mobile = cookies.get('sessionMobile');
    const batch = cookies.get('sessionBatch');
    return token && mobile && batch ? { token, mobile, batch } : null;
  },

  clearSession: () => {
    cookies.delete('sessionToken');
    cookies.delete('sessionMobile');
    cookies.delete('sessionBatch');
  },
};
