// 60+ Suspicious PE (Portable Executable) Import Functions
// These Windows API functions are commonly abused by malware

export interface SuspiciousImport {
    name: string;
    category: string;
    risk: 'low' | 'medium' | 'high' | 'critical';
    description: string;
}

export const suspiciousImports: SuspiciousImport[] = [
    // Process Injection
    { name: 'CreateRemoteThread', category: 'Process Injection', risk: 'critical', description: 'Creates a thread in another process - classic injection technique' },
    { name: 'CreateRemoteThreadEx', category: 'Process Injection', risk: 'critical', description: 'Extended remote thread creation' },
    { name: 'VirtualAllocEx', category: 'Process Injection', risk: 'critical', description: 'Allocates memory in another process' },
    { name: 'VirtualProtectEx', category: 'Process Injection', risk: 'high', description: 'Changes memory protection in another process' },
    { name: 'WriteProcessMemory', category: 'Process Injection', risk: 'critical', description: 'Writes data to another process memory' },
    { name: 'ReadProcessMemory', category: 'Process Injection', risk: 'high', description: 'Reads data from another process memory' },
    { name: 'NtCreateThreadEx', category: 'Process Injection', risk: 'critical', description: 'Native API thread creation - stealthier injection' },
    { name: 'RtlCreateUserThread', category: 'Process Injection', risk: 'critical', description: 'Native API user thread creation' },
    { name: 'NtMapViewOfSection', category: 'Process Injection', risk: 'high', description: 'Maps section into process - process hollowing' },
    { name: 'NtUnmapViewOfSection', category: 'Process Injection', risk: 'high', description: 'Unmaps section - process hollowing cleanup' },
    { name: 'QueueUserAPC', category: 'Process Injection', risk: 'high', description: 'APC injection technique' },
    { name: 'SetThreadContext', category: 'Process Injection', risk: 'critical', description: 'Modifies thread context - thread hijacking' },
    { name: 'SuspendThread', category: 'Process Injection', risk: 'medium', description: 'Suspends thread execution' },
    { name: 'ResumeThread', category: 'Process Injection', risk: 'medium', description: 'Resumes suspended thread' },

    // Keylogging & Input Capture
    { name: 'GetAsyncKeyState', category: 'Keylogging', risk: 'high', description: 'Captures keyboard state - keylogger indicator' },
    { name: 'GetKeyState', category: 'Keylogging', risk: 'medium', description: 'Gets key state - potential keylogger' },
    { name: 'SetWindowsHookExA', category: 'Keylogging', risk: 'critical', description: 'Installs system-wide hook - keyboard/mouse capture' },
    { name: 'SetWindowsHookExW', category: 'Keylogging', risk: 'critical', description: 'Installs system-wide hook (Unicode)' },
    { name: 'GetClipboardData', category: 'Keylogging', risk: 'medium', description: 'Reads clipboard data - data theft' },
    { name: 'SetClipboardData', category: 'Keylogging', risk: 'medium', description: 'Modifies clipboard data' },

    // Anti-Debug & Evasion
    { name: 'IsDebuggerPresent', category: 'Anti-Debug', risk: 'high', description: 'Detects debugger presence' },
    { name: 'CheckRemoteDebuggerPresent', category: 'Anti-Debug', risk: 'high', description: 'Checks for remote debugger' },
    { name: 'NtQueryInformationProcess', category: 'Anti-Debug', risk: 'high', description: 'Can detect debugging and sandbox environments' },
    { name: 'OutputDebugStringA', category: 'Anti-Debug', risk: 'low', description: 'Debug output - anti-debug timing' },
    { name: 'GetTickCount', category: 'Anti-Debug', risk: 'low', description: 'Timing check - sandbox detection' },
    { name: 'QueryPerformanceCounter', category: 'Anti-Debug', risk: 'low', description: 'High-precision timing - anti-debug' },
    { name: 'NtQuerySystemInformation', category: 'Anti-Debug', risk: 'medium', description: 'System info query - VM/sandbox detection' },

    // Privilege Escalation
    { name: 'AdjustTokenPrivileges', category: 'Privilege Escalation', risk: 'critical', description: 'Modifies process privileges' },
    { name: 'OpenProcessToken', category: 'Privilege Escalation', risk: 'high', description: 'Opens process token for privilege manipulation' },
    { name: 'LookupPrivilegeValueA', category: 'Privilege Escalation', risk: 'medium', description: 'Looks up privilege value by name' },
    { name: 'ImpersonateLoggedOnUser', category: 'Privilege Escalation', risk: 'critical', description: 'Impersonates another user' },
    { name: 'DuplicateTokenEx', category: 'Privilege Escalation', risk: 'high', description: 'Duplicates access token' },

    // Registry Manipulation
    { name: 'RegSetValueExA', category: 'Registry', risk: 'medium', description: 'Sets registry value - persistence/config' },
    { name: 'RegSetValueExW', category: 'Registry', risk: 'medium', description: 'Sets registry value (Unicode)' },
    { name: 'RegCreateKeyExA', category: 'Registry', risk: 'medium', description: 'Creates registry key - persistence' },
    { name: 'RegDeleteValueA', category: 'Registry', risk: 'medium', description: 'Deletes registry value' },
    { name: 'RegOpenKeyExA', category: 'Registry', risk: 'low', description: 'Opens registry key' },

    // Network Operations
    { name: 'InternetOpenA', category: 'Network', risk: 'medium', description: 'Initializes WinINet - network communication' },
    { name: 'InternetOpenUrlA', category: 'Network', risk: 'high', description: 'Opens URL - C2 communication' },
    { name: 'InternetReadFile', category: 'Network', risk: 'medium', description: 'Reads data from URL' },
    { name: 'HttpSendRequestA', category: 'Network', risk: 'medium', description: 'Sends HTTP request' },
    { name: 'URLDownloadToFileA', category: 'Network', risk: 'critical', description: 'Downloads file from URL - dropper behavior' },
    { name: 'URLDownloadToFileW', category: 'Network', risk: 'critical', description: 'Downloads file from URL (Unicode)' },
    { name: 'WinHttpOpen', category: 'Network', risk: 'medium', description: 'Opens WinHTTP session' },
    { name: 'WSAStartup', category: 'Network', risk: 'low', description: 'Initializes Winsock - raw network' },
    { name: 'connect', category: 'Network', risk: 'medium', description: 'Socket connect - network communication' },
    { name: 'send', category: 'Network', risk: 'medium', description: 'Socket send - data exfiltration' },
    { name: 'recv', category: 'Network', risk: 'medium', description: 'Socket receive' },
    { name: 'InternetConnectA', category: 'Network', risk: 'medium', description: 'Establishes internet connection' },

    // Process/Thread Manipulation
    { name: 'CreateProcessA', category: 'Process', risk: 'medium', description: 'Creates new process' },
    { name: 'CreateProcessW', category: 'Process', risk: 'medium', description: 'Creates new process (Unicode)' },
    { name: 'OpenProcess', category: 'Process', risk: 'high', description: 'Opens handle to another process' },
    { name: 'TerminateProcess', category: 'Process', risk: 'high', description: 'Terminates a process' },
    { name: 'ShellExecuteA', category: 'Process', risk: 'high', description: 'Executes shell command' },
    { name: 'ShellExecuteExW', category: 'Process', risk: 'high', description: 'Extended shell execution' },
    { name: 'WinExec', category: 'Process', risk: 'high', description: 'Executes command - legacy function' },

    // DLL/Module Loading
    { name: 'LoadLibraryA', category: 'DLL Loading', risk: 'medium', description: 'Loads DLL - DLL injection setup' },
    { name: 'LoadLibraryW', category: 'DLL Loading', risk: 'medium', description: 'Loads DLL (Unicode)' },
    { name: 'LoadLibraryExA', category: 'DLL Loading', risk: 'medium', description: 'Extended DLL loading' },
    { name: 'GetProcAddress', category: 'DLL Loading', risk: 'medium', description: 'Gets function address - dynamic resolution' },
    { name: 'LdrLoadDll', category: 'DLL Loading', risk: 'high', description: 'Native API DLL loading - evasion' },

    // Cryptography
    { name: 'CryptEncrypt', category: 'Cryptography', risk: 'medium', description: 'Encrypts data - ransomware indicator' },
    { name: 'CryptDecrypt', category: 'Cryptography', risk: 'medium', description: 'Decrypts data' },
    { name: 'CryptGenKey', category: 'Cryptography', risk: 'medium', description: 'Generates crypto key - ransomware setup' },
    { name: 'CryptAcquireContextA', category: 'Cryptography', risk: 'low', description: 'Acquires crypto provider context' },
    { name: 'CryptImportKey', category: 'Cryptography', risk: 'medium', description: 'Imports cryptographic key' },
    { name: 'BCryptEncrypt', category: 'Cryptography', risk: 'medium', description: 'BCrypt encryption' },

    // Service Manipulation
    { name: 'CreateServiceA', category: 'Service', risk: 'high', description: 'Creates Windows service - persistence' },
    { name: 'StartServiceA', category: 'Service', risk: 'medium', description: 'Starts a service' },
    { name: 'ControlService', category: 'Service', risk: 'medium', description: 'Controls a service' },
    { name: 'OpenSCManagerA', category: 'Service', risk: 'medium', description: 'Opens service control manager' },
];

export const getSuspiciousImportsByCategory = (): Record<string, SuspiciousImport[]> => {
    const categories: Record<string, SuspiciousImport[]> = {};
    suspiciousImports.forEach(imp => {
        if (!categories[imp.category]) categories[imp.category] = [];
        categories[imp.category].push(imp);
    });
    return categories;
};
