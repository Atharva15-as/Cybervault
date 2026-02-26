// Malicious domains, suspicious TLDs, and phishing brand targets

export const maliciousDomains: string[] = [
    'malware-payload.xyz', 'evil-download.top', 'phish-login.ru', 'trojan-c2.cn',
    'botnet-master.tk', 'ransomware-pay.onion', 'exploit-kit.cc', 'stealer-panel.pw',
    'drop-zone.su', 'dark-market.biz', 'hack-tools.ws', 'spam-relay.info',
    'scam-site.ga', 'fake-update.ml', 'drive-by.cf', 'keylogger-send.gq',
    'c2-server.click', 'data-exfil.buzz', 'crypto-steal.monster', 'rat-control.sbs',
    'backdoor-access.cam', 'miner-pool.cyou', 'ddos-booter.icu', 'spoof-dns.rest',
    'phishing-kit.cfd', 'zero-day.bond', 'brute-force.autos', 'rootkit-drop.beauty',
    'worm-spread.hair', 'skimmer-js.mom', 'formgrab.quest', 'credential-harvest.sbs',
];

export const suspiciousTlds: string[] = [
    '.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.pw', '.cc', '.su',
    '.ws', '.click', '.buzz', '.monster', '.sbs', '.cam', '.cyou', '.icu',
    '.rest', '.cfd', '.bond', '.autos', '.beauty', '.hair', '.mom', '.quest',
    '.bid', '.loan', '.win', '.party', '.review', '.stream', '.trade', '.date',
    '.racing', '.cricket', '.science', '.download', '.accountant', '.faith',
];

export const phishingBrands: { name: string; patterns: string[] }[] = [
    { name: 'PayPal', patterns: ['paypal', 'paypa1', 'paypai', 'pay-pal', 'peypal'] },
    { name: 'Apple', patterns: ['apple', 'app1e', 'icloud', 'appleid', 'apple-id'] },
    { name: 'Microsoft', patterns: ['microsoft', 'micros0ft', 'outlook', 'office365', 'onedrive', 'hotmail'] },
    { name: 'Google', patterns: ['google', 'g00gle', 'gmail', 'gdrive', 'gooogle'] },
    { name: 'Amazon', patterns: ['amazon', 'amaz0n', 'amazom', 'aws-login'] },
    { name: 'Netflix', patterns: ['netflix', 'netfl1x', 'net-flix'] },
    { name: 'Facebook', patterns: ['facebook', 'faceb00k', 'fb-login', 'meta-login'] },
    { name: 'Instagram', patterns: ['instagram', 'instagrm', 'lnstagram'] },
    { name: 'Twitter/X', patterns: ['twitter', 'tw1tter', 'x-login', 'x-verify'] },
    { name: 'LinkedIn', patterns: ['linkedin', 'linked1n', 'linkdin'] },
    { name: 'Bank of America', patterns: ['bankofamerica', 'boa-login', 'bofa-secure'] },
    { name: 'Chase', patterns: ['chase', 'chas3', 'chase-secure', 'jpmorgan'] },
    { name: 'Wells Fargo', patterns: ['wellsfargo', 'wells-fargo', 'wf-secure'] },
    { name: 'USPS', patterns: ['usps', 'us-postal', 'usps-tracking'] },
    { name: 'FedEx', patterns: ['fedex', 'fed-ex', 'fedex-tracking'] },
    { name: 'DHL', patterns: ['dhl', 'dhl-express', 'dhl-tracking'] },
    { name: 'Dropbox', patterns: ['dropbox', 'dr0pbox', 'drop-box'] },
    { name: 'Steam', patterns: ['steam', 'steamcommunity', 'steampowered'] },
    { name: 'Discord', patterns: ['discord', 'disc0rd', 'discordapp'] },
    { name: 'WhatsApp', patterns: ['whatsapp', 'whats-app', 'watsapp'] },
    { name: 'Telegram', patterns: ['telegram', 'te1egram', 'tg-login'] },
    { name: 'Coinbase', patterns: ['coinbase', 'c0inbase', 'coinbase-pro'] },
    { name: 'Binance', patterns: ['binance', 'b1nance', 'binance-login'] },
    { name: 'Crypto.com', patterns: ['crypto.com', 'crypt0', 'crypto-wallet'] },
];

export const isDomainMalicious = (domain: string): boolean => {
    const lower = domain.toLowerCase();
    return maliciousDomains.some(d => lower.includes(d));
};

export const isTldSuspicious = (url: string): boolean => {
    const lower = url.toLowerCase();
    return suspiciousTlds.some(tld => lower.endsWith(tld));
};

export const detectPhishingBrand = (url: string): string | null => {
    const lower = url.toLowerCase();
    for (const brand of phishingBrands) {
        for (const pattern of brand.patterns) {
            if (lower.includes(pattern) && !lower.includes(brand.name.toLowerCase() + '.com')) {
                return brand.name;
            }
        }
    }
    return null;
};
