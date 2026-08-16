export interface WebmailInfo {
  providerName: string;
  webmailUrl: string;
  mailtoUrl: string;
  isKnownProvider: boolean;
}

export function getWebmailInfo(email: string): WebmailInfo {
  const mailtoUrl = `mailto:${email}`;
  const domain = email.includes('@') ? email.split('@')[1].toLowerCase().trim() : '';

  if (!domain) {
    return {
      providerName: 'Email App',
      webmailUrl: mailtoUrl,
      mailtoUrl,
      isKnownProvider: false,
    };
  }

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return {
      providerName: 'Gmail',
      webmailUrl: 'https://mail.google.com',
      mailtoUrl,
      isKnownProvider: true,
    };
  }

  if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'passport.com'].includes(domain)) {
    return {
      providerName: 'Outlook',
      webmailUrl: 'https://outlook.live.com',
      mailtoUrl,
      isKnownProvider: true,
    };
  }

  if (['yahoo.com', 'ymail.com', 'myyahoo.com', 'yahoo.co.uk', 'yahoo.in'].some((d) => domain.endsWith(d))) {
    return {
      providerName: 'Yahoo Mail',
      webmailUrl: 'https://mail.yahoo.com',
      mailtoUrl,
      isKnownProvider: true,
    };
  }

  if (['icloud.com', 'me.com', 'mac.com'].includes(domain)) {
    return {
      providerName: 'iCloud Mail',
      webmailUrl: 'https://www.icloud.com/mail',
      mailtoUrl,
      isKnownProvider: true,
    };
  }

  if (['proton.me', 'protonmail.com', 'pm.me'].includes(domain)) {
    return {
      providerName: 'ProtonMail',
      webmailUrl: 'https://mail.proton.me',
      mailtoUrl,
      isKnownProvider: true,
    };
  }

  if (domain.includes('zoho')) {
    return {
      providerName: 'Zoho Mail',
      webmailUrl: 'https://mail.zoho.com',
      mailtoUrl,
      isKnownProvider: true,
    };
  }

  return {
    providerName: `${domain} Mail`,
    webmailUrl: `https://mail.${domain}`,
    mailtoUrl,
    isKnownProvider: false,
  };
}
