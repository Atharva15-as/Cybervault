// 72 Scan Engines for simulated multi-engine scanning
export interface ScanEngine {
    name: string;
    category: 'antivirus' | 'endpoint' | 'behavioral' | 'ml' | 'sandbox' | 'reputation' | 'heuristic';
    version: string;
    reliability: number;
}

const e = (name: string, cat: ScanEngine['category'], ver: string, rel: number): ScanEngine =>
    ({ name, category: cat, version: ver, reliability: rel });

export const scanEngines: ScanEngine[] = [
    e('AegisShield', 'antivirus', '4.12.1', 0.92), e('ArcticWolf AV', 'antivirus', '7.3.0', 0.88),
    e('BarracudaScan', 'antivirus', '3.8.2', 0.85), e('ByteDefender', 'antivirus', '12.0.4', 0.94),
    e('CerberusAV', 'antivirus', '5.6.1', 0.90), e('CipherGuard', 'antivirus', '8.1.3', 0.87),
    e('CobaltShield', 'antivirus', '6.4.2', 0.91), e('CyberSentinel', 'antivirus', '9.2.0', 0.93),
    e('DarkTrace AV', 'antivirus', '2.7.5', 0.89), e('DragonForce', 'antivirus', '11.0.1', 0.86),
    e('ElectronShield', 'antivirus', '4.5.3', 0.84), e('FalconScan', 'antivirus', '7.8.0', 0.95),
    e('FortiScan', 'antivirus', '6.2.1', 0.92), e('GhostArmor', 'antivirus', '3.1.4', 0.83),
    e('GridIron', 'antivirus', '5.9.2', 0.88), e('HawkEye AV', 'antivirus', '8.3.1', 0.90),
    e('IronClad', 'antivirus', '10.1.0', 0.91), e('KryptonAV', 'antivirus', '4.7.3', 0.87),
    e('NexusEDR', 'endpoint', '3.4.1', 0.93), e('PrismGuard EDR', 'endpoint', '6.1.2', 0.91),
    e('QuantumEDR', 'endpoint', '2.8.0', 0.94), e('SentryPoint', 'endpoint', '5.3.4', 0.90),
    e('VanguardEDR', 'endpoint', '7.0.1', 0.92), e('WatchTower EDR', 'endpoint', '4.6.2', 0.89),
    e('ZeusShield EDR', 'endpoint', '8.2.0', 0.95), e('ApexDetect', 'endpoint', '3.9.1', 0.88),
    e('TitanGuard', 'endpoint', '5.1.3', 0.86),
    e('BehaviorScan Pro', 'behavioral', '2.4.1', 0.90), e('DynamicWatch', 'behavioral', '4.1.0', 0.88),
    e('ExecAnalyzer', 'behavioral', '3.2.5', 0.87), e('FlowMonitor', 'behavioral', '5.0.3', 0.85),
    e('IntentAnalysis', 'behavioral', '1.8.2', 0.83), e('PatternHawk', 'behavioral', '6.3.1', 0.91),
    e('RuntimeGuard', 'behavioral', '2.9.0', 0.89), e('ThreatBehavior', 'behavioral', '4.5.2', 0.86),
    e('ActionAnalyzer', 'behavioral', '3.7.1', 0.84),
    e('CortexML', 'ml', '2.1.0', 0.92), e('DeepScanAI', 'ml', '3.5.1', 0.94),
    e('NeuralDetect', 'ml', '1.9.4', 0.91), e('QuantumBrain', 'ml', '4.2.0', 0.93),
    e('SynapseAI', 'ml', '2.6.3', 0.90), e('TensorShield', 'ml', '5.1.2', 0.95),
    e('VectorScan AI', 'ml', '3.0.1', 0.89), e('AlphaDetect ML', 'ml', '1.4.0', 0.87),
    e('PredictGuard', 'ml', '2.3.5', 0.88),
    e('CloudSandbox', 'sandbox', '3.1.0', 0.91), e('DetonationBox', 'sandbox', '2.4.2', 0.93),
    e('IsolateScan', 'sandbox', '4.0.1', 0.90), e('SafeExec', 'sandbox', '1.7.3', 0.88),
    e('VirtualForge', 'sandbox', '5.2.0', 0.92), e('SandStorm', 'sandbox', '3.8.1', 0.89),
    e('ContainerScan', 'sandbox', '2.1.4', 0.86), e('EmulateGuard', 'sandbox', '4.3.2', 0.87),
    e('TestBed Pro', 'sandbox', '1.9.0', 0.85),
    e('CloudReputation', 'reputation', '6.0.1', 0.90), e('GlobalThreatDB', 'reputation', '8.2.3', 0.93),
    e('HashLookup', 'reputation', '4.1.0', 0.88), e('ReputationNet', 'reputation', '3.5.2', 0.91),
    e('ThreatIntel', 'reputation', '7.0.4', 0.94), e('SignatureCloud', 'reputation', '5.3.1', 0.89),
    e('CommunityShield', 'reputation', '2.8.0', 0.86), e('IOC Matcher', 'reputation', '4.6.2', 0.92),
    e('ViralDB', 'reputation', '9.1.0', 0.87),
    e('HeuraScan', 'heuristic', '3.2.1', 0.85), e('LogicGuard', 'heuristic', '5.4.0', 0.88),
    e('PatternLogic', 'heuristic', '2.7.3', 0.86), e('RiskAnalyzer', 'heuristic', '4.0.2', 0.84),
    e('SmartDetect', 'heuristic', '6.1.1', 0.90), e('StaticHawk', 'heuristic', '3.9.0', 0.87),
    e('StructureScan', 'heuristic', '1.5.4', 0.83), e('AnomalyFinder', 'heuristic', '2.2.1', 0.82),
    e('ProbeGuard', 'heuristic', '4.8.3', 0.89),
];

export const getEnginesByCategory = (): Record<string, ScanEngine[]> => {
    const cats: Record<string, ScanEngine[]> = {};
    scanEngines.forEach(eng => {
        if (!cats[eng.category]) cats[eng.category] = [];
        cats[eng.category].push(eng);
    });
    return cats;
};
