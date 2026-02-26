// 40+ Detection Patterns for file content analysis
// These patterns match against file content to detect malicious code

export interface DetectionPattern {
    id: string;
    name: string;
    pattern: string;
    isRegex: boolean;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
}

export const detectionPatterns: DetectionPattern[] = [
    // Shell Commands
    { id: 'SHELL_CMD', name: 'Command Shell', pattern: 'cmd\\.exe', isRegex: true, category: 'Shell', severity: 'high', description: 'Windows command shell reference' },
    { id: 'SHELL_PS', name: 'PowerShell', pattern: 'powershell', isRegex: false, category: 'Shell', severity: 'high', description: 'PowerShell execution reference' },
    { id: 'SHELL_PS_ENC', name: 'PowerShell Encoded', pattern: '-[eE]nc(odedcommand)?\\s+[A-Za-z0-9+/=]{20,}', isRegex: true, category: 'Shell', severity: 'critical', description: 'Base64 encoded PowerShell command' },
    { id: 'SHELL_BASH', name: 'Bash Shell', pattern: '/bin/(ba)?sh', isRegex: true, category: 'Shell', severity: 'medium', description: 'Unix shell reference' },
    { id: 'SHELL_WSCRIPT', name: 'Windows Script Host', pattern: 'wscript|cscript', isRegex: true, category: 'Shell', severity: 'high', description: 'Windows Script Host execution' },

    // Network Indicators
    { id: 'NET_REVERSE_SHELL', name: 'Reverse Shell', pattern: 'socket.*connect|nc\\s+-e|ncat.*-e|bash\\s+-i', isRegex: true, category: 'Network', severity: 'critical', description: 'Reverse shell pattern detected' },
    { id: 'NET_BIND_SHELL', name: 'Bind Shell', pattern: 'socket.*bind.*listen|nc\\s+-l', isRegex: true, category: 'Network', severity: 'critical', description: 'Bind shell pattern detected' },
    { id: 'NET_C2_BEACON', name: 'C2 Beacon', pattern: 'beacon|callback|heartbeat.*http', isRegex: true, category: 'Network', severity: 'high', description: 'Command & control beacon pattern' },
    { id: 'NET_DNS_TUNNEL', name: 'DNS Tunneling', pattern: 'dns.*tunnel|iodine|dnscat', isRegex: true, category: 'Network', severity: 'high', description: 'DNS tunneling indicators' },
    { id: 'NET_IRC', name: 'IRC Communication', pattern: 'JOIN\\s+#|PRIVMSG|NICK\\s+\\w+', isRegex: true, category: 'Network', severity: 'medium', description: 'IRC bot communication pattern' },

    // Exploit Indicators
    { id: 'EXP_NOP_SLED', name: 'NOP Sled', pattern: '(\\x90){16,}', isRegex: true, category: 'Exploit', severity: 'critical', description: 'NOP sled detected - buffer overflow exploit' },
    { id: 'EXP_SHELLCODE_X86', name: 'x86 Shellcode', pattern: '\\xeb\\x..\\x5.|\\x31\\xc0\\x50|\\xfc\\xe8', isRegex: true, category: 'Exploit', severity: 'critical', description: 'x86 shellcode patterns detected' },
    { id: 'EXP_HEAP_SPRAY', name: 'Heap Spray', pattern: '0x0c0c0c0c|0x0d0d0d0d|unescape.*%u', isRegex: true, category: 'Exploit', severity: 'critical', description: 'Heap spray pattern detected' },

    // Obfuscation
    { id: 'OBF_BASE64', name: 'Base64 Payload', pattern: '[A-Za-z0-9+/]{100,}={0,2}', isRegex: true, category: 'Obfuscation', severity: 'medium', description: 'Large base64 encoded payload' },
    { id: 'OBF_HEX_STRING', name: 'Hex Encoded String', pattern: '(\\\\x[0-9a-fA-F]{2}){20,}', isRegex: true, category: 'Obfuscation', severity: 'medium', description: 'Long hex encoded string' },
    { id: 'OBF_CHAR_CODE', name: 'CharCode Obfuscation', pattern: 'String\\.fromCharCode|chr\\(\\d+\\)', isRegex: true, category: 'Obfuscation', severity: 'medium', description: 'Character code obfuscation' },
    { id: 'OBF_EVAL', name: 'Dynamic Eval', pattern: 'eval\\s*\\(|exec\\s*\\(|Function\\s*\\(', isRegex: true, category: 'Obfuscation', severity: 'high', description: 'Dynamic code evaluation' },
    { id: 'OBF_XOR_LOOP', name: 'XOR Decryption Loop', pattern: 'xor.*loop|\\^=\\s*0x', isRegex: true, category: 'Obfuscation', severity: 'high', description: 'XOR decryption loop pattern' },

    // Ransomware Indicators
    { id: 'RANSOM_ENCRYPT', name: 'Ransomware Encryption', pattern: 'encrypt.*files|AES.*encrypt|RSA.*encrypt', isRegex: true, category: 'Ransomware', severity: 'critical', description: 'File encryption routine detected' },
    { id: 'RANSOM_NOTE', name: 'Ransom Note', pattern: 'your files.*encrypted|pay.*bitcoin|ransom|decrypt.*files', isRegex: true, category: 'Ransomware', severity: 'critical', description: 'Ransom note text detected' },
    { id: 'RANSOM_EXTENSION', name: 'Ransomware Extensions', pattern: '\\.(locked|encrypted|crypt|cry|enc)$', isRegex: true, category: 'Ransomware', severity: 'high', description: 'Known ransomware file extensions' },
    { id: 'RANSOM_SHADOW', name: 'Shadow Copy Delete', pattern: 'vssadmin.*delete|wmic.*shadowcopy', isRegex: true, category: 'Ransomware', severity: 'critical', description: 'Volume shadow copy deletion' },

    // Persistence Mechanisms
    { id: 'PERSIST_RUN_KEY', name: 'Registry Run Key', pattern: 'CurrentVersion\\\\Run|SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run', isRegex: true, category: 'Persistence', severity: 'high', description: 'Registry autorun key reference' },
    { id: 'PERSIST_SCHTASK', name: 'Scheduled Task', pattern: 'schtasks.*\\/create|at\\s+\\d+:\\d+', isRegex: true, category: 'Persistence', severity: 'high', description: 'Scheduled task creation' },
    { id: 'PERSIST_SERVICE', name: 'Service Creation', pattern: 'sc\\s+create|New-Service', isRegex: true, category: 'Persistence', severity: 'high', description: 'Windows service installation' },
    { id: 'PERSIST_STARTUP', name: 'Startup Folder', pattern: 'Startup.*\\\\Programs|shell:startup', isRegex: true, category: 'Persistence', severity: 'medium', description: 'Startup folder manipulation' },
    { id: 'PERSIST_WMI', name: 'WMI Persistence', pattern: 'WMI.*Event|__EventConsumer|CommandLineEventConsumer', isRegex: true, category: 'Persistence', severity: 'high', description: 'WMI event subscription persistence' },

    // Credential Theft
    { id: 'CRED_LSASS', name: 'LSASS Access', pattern: 'lsass\\.exe|sekurlsa|mimikatz', isRegex: true, category: 'Credential Theft', severity: 'critical', description: 'LSASS credential dumping' },
    { id: 'CRED_SAM', name: 'SAM Database', pattern: 'SAM.*hive|system.*hive|reg.*save.*SAM', isRegex: true, category: 'Credential Theft', severity: 'critical', description: 'SAM database extraction' },
    { id: 'CRED_BROWSER', name: 'Browser Credentials', pattern: 'Login Data|cookies\\.sqlite|logins\\.json', isRegex: true, category: 'Credential Theft', severity: 'high', description: 'Browser credential file access' },
    { id: 'CRED_KEYCHAIN', name: 'Keychain Access', pattern: 'security.*find-generic-password|keychain', isRegex: true, category: 'Credential Theft', severity: 'high', description: 'macOS keychain access' },

    // Data Exfiltration
    { id: 'EXFIL_ARCHIVE', name: 'Data Archiving', pattern: 'tar\\s+c|zip.*-r|rar\\s+a|7z\\s+a', isRegex: true, category: 'Exfiltration', severity: 'medium', description: 'Data compression for exfiltration' },
    { id: 'EXFIL_UPLOAD', name: 'File Upload', pattern: 'curl.*-F|wget.*--post-file|Invoke-WebRequest.*-Method\\s+Post', isRegex: true, category: 'Exfiltration', severity: 'high', description: 'File upload pattern detected' },
    { id: 'EXFIL_EMAIL', name: 'Email Exfil', pattern: 'smtp.*send|sendmail|Net\\.Mail', isRegex: true, category: 'Exfiltration', severity: 'medium', description: 'Email-based data exfiltration' },

    // Anti-AV / Evasion
    { id: 'EVASION_AMSI', name: 'AMSI Bypass', pattern: 'AmsiScanBuffer|amsi\\.dll|AmsiInitialize', isRegex: true, category: 'Evasion', severity: 'critical', description: 'AMSI bypass attempt detected' },
    { id: 'EVASION_ETW', name: 'ETW Bypass', pattern: 'EtwEventWrite|NtTraceEvent', isRegex: true, category: 'Evasion', severity: 'high', description: 'Event Tracing bypass attempt' },
    { id: 'EVASION_DISABLE_AV', name: 'Disable AV', pattern: 'Set-MpPreference|DisableRealtimeMonitoring|windows defender', isRegex: true, category: 'Evasion', severity: 'critical', description: 'Attempt to disable antivirus' },
    { id: 'EVASION_SLEEP', name: 'Execution Delay', pattern: 'Sleep\\(\\d{5,}\\)|Start-Sleep.*-s\\s+\\d{3,}|timeout.*\\/t\\s+\\d{3,}', isRegex: true, category: 'Evasion', severity: 'medium', description: 'Long sleep to evade sandboxes' },

    // Lateral Movement
    { id: 'LATERAL_PSEXEC', name: 'PsExec', pattern: 'psexec|PSEXESVC', isRegex: true, category: 'Lateral Movement', severity: 'high', description: 'PsExec remote execution' },
    { id: 'LATERAL_WMI_EXEC', name: 'WMI Execution', pattern: 'wmic.*process.*call.*create|Invoke-WmiMethod', isRegex: true, category: 'Lateral Movement', severity: 'high', description: 'WMI-based remote execution' },
    { id: 'LATERAL_WINRM', name: 'WinRM', pattern: 'Invoke-Command.*-ComputerName|Enter-PSSession', isRegex: true, category: 'Lateral Movement', severity: 'high', description: 'WinRM remote execution' },
];

export const getPatternsByCategory = (): Record<string, DetectionPattern[]> => {
    const categories: Record<string, DetectionPattern[]> = {};
    detectionPatterns.forEach(p => {
        if (!categories[p.category]) categories[p.category] = [];
        categories[p.category].push(p);
    });
    return categories;
};
