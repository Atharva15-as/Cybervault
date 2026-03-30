import { useState } from 'react';
import { Plus, Timer, RefreshCw, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import deadManSwitchService, { DeadManSwitch } from '../services/deadManSwitchService';

export default function DeadManSwitchPage() {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const [switches, setSwitches] = useState<DeadManSwitch[]>(deadManSwitchService.getAll());
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', days: 30, recipientName: '', recipientEmail: '', recipientMessage: '' });
    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    const handleCreate = () => {
        if (!form.name || !form.recipientEmail) { addToast({ type: 'error', title: 'Missing Fields', message: 'Name and recipient email are required' }); return; }
        deadManSwitchService.create({
            name: form.name, description: form.description, checkInIntervalDays: form.days,
            recipients: [{ name: form.recipientName, email: form.recipientEmail, message: form.recipientMessage }],
            fileIds: [],
        });
        setSwitches(deadManSwitchService.getAll());
        setShowCreate(false);
        setForm({ name: '', description: '', days: 30, recipientName: '', recipientEmail: '', recipientMessage: '' });
        addToast({ type: 'success', title: 'Switch Created', message: `Check-in required every ${form.days} days` });
    };

    const handleCheckIn = (id: string) => {
        deadManSwitchService.checkIn(id);
        setSwitches(deadManSwitchService.getAll());
        addToast({ type: 'success', title: 'Checked In!', message: 'Timer reset successfully' });
    };

    const statusColors = { safe: 'text-green-500 bg-green-500/10', warning: 'text-yellow-500 bg-yellow-500/10', critical: 'text-red-500 bg-red-500/10', triggered: 'text-red-500 bg-red-500/10' };

    const steps = [
        { step: '1', title: 'Create Switch', desc: 'Define your trusted contacts and write a final message.' },
        { step: '2', title: 'Regular Check-ins', desc: 'Return to the app to reset the timer before your specific interval expires.' },
        { step: '3', title: 'Auto-Trigger', desc: 'If the timer hits zero without a check-in, your payload is automatically sent.' },
    ];

    const features = [
        { icon: Timer, title: 'Custom Intervals', desc: 'Set your dead drop timer anywhere from 1 to 365 days.' },
        { icon: AlertTriangle, title: 'Grace Period Alerts', desc: 'Receive automated warnings as the final countdown approaches.' },
        { icon: CheckCircle, title: 'Secure Dispatch', desc: 'Recipients get a secure expiring link protected with zero-knowledge.' },
    ];

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                        <Timer className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-500 font-medium">Emergency Protocol</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-bold font-heading mb-4 ${textPrimary}`}>Dead Man's <span className="gradient-text">Switch</span></h1>
                    <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>
                        Auto-share files with trusted contacts if you stop checking in. Your digital dead drop for emergencies.
                    </p>
                </div>

                {/* Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT SIDE — How to Use + Features */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-card p-6 sticky top-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                </div>
                                <h2 className={`text-lg font-bold ${textPrimary}`}>How to Use</h2>
                            </div>

                            <div className="space-y-5">
                                {steps.map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-red-500/25">
                                            {item.step}
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <h4 className={`text-sm font-semibold mb-1 ${textPrimary}`}>{item.title}</h4>
                                            <p className={`text-xs leading-relaxed ${textMuted}`}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={`my-6 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`} />

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <Timer className="h-5 w-5 text-red-500" />
                                </div>
                                <h2 className={`text-lg font-bold ${textPrimary}`}>Features & Working</h2>
                            </div>

                            <div className="space-y-4">
                                {features.map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <item.icon className="h-4 w-4 text-red-500" />
                                            <h4 className={`text-sm font-semibold ${textPrimary}`}>{item.title}</h4>
                                        </div>
                                        <p className={`text-xs leading-relaxed ${textMuted}`}>{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE — Tool */}
                    <div className="lg:col-span-8">
                        <button onClick={() => setShowCreate(true)} className="btn-primary mb-8 flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Create New Switch
                        </button>

                        {/* Create Form */}
                        {showCreate && (
                            <div className="glass-card p-6 mb-8 border-2 border-red-500/20 relative overflow-hidden">
                                <h3 className={`font-semibold mb-4 text-xl ${textPrimary}`}>New Dead Man's Switch</h3>
                                <div className="space-y-5 relative z-10">
                                    <div>
                                        <label className={`text-sm font-medium mb-1 block ${textMuted}`}>Strategy Name</label>
                                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Emergency Vault Access..." className="input-field" />
                                    </div>
                                    <div>
                                        <label className={`text-sm font-medium mb-1 block ${textMuted}`}>Description (Optional)</label>
                                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details internally for yourself..." className="input-field" rows={2} />
                                    </div>
                                    <div>
                                        <label className={`text-sm font-medium mb-1 block ${textMuted}`}>Check-in Interval (days)</label>
                                        <input type="number" value={form.days} onChange={e => setForm({ ...form, days: parseInt(e.target.value) || 1 })} min={1} max={365} className="input-field max-w-[150px]" />
                                    </div>
                                    
                                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#1E293B]/70 border-dark-600' : 'bg-[#E4F3EC]/50 border-gray-200'}`}>
                                        <h4 className={`text-sm font-bold mb-4 uppercase tracking-wider text-red-500 flex items-center gap-2`}>
                                            <AlertTriangle className="h-4 w-4" /> Trusted Contact (Recipient)
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={`text-xs font-medium mb-1 block ${textMuted}`}>Contact Name</label>
                                                    <input type="text" value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} placeholder="e.g. John Doe" className="input-field text-sm" />
                                                </div>
                                                <div>
                                                    <label className={`text-xs font-medium mb-1 block ${textMuted}`}>Email Address</label>
                                                    <input type="email" value={form.recipientEmail} onChange={e => setForm({ ...form, recipientEmail: e.target.value })} placeholder="contact@example.com" className="input-field text-sm" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={`text-xs font-medium mb-1 block ${textMuted}`}>Final Message to Send</label>
                                                <textarea value={form.recipientMessage} onChange={e => setForm({ ...form, recipientMessage: e.target.value })} placeholder="This message will be sent with your files when the switch triggers..." className="input-field text-sm" rows={3} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4 border-t border-gray-700/20">
                                        <button onClick={handleCreate} className="btn-primary w-full md:w-auto">Create Emergency Switch</button>
                                        <button onClick={() => setShowCreate(false)} className="btn-secondary w-full md:w-auto">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Switches List */}
                        <div className="space-y-4">
                            {switches.length === 0 ? (
                                <div className="glass-card p-12 text-center border-dashed border-2">
                                    <Timer className={`h-16 w-16 mx-auto mb-4 ${textMuted} opacity-30`} />
                                    <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>No Active Switches</h3>
                                    <p className={textMuted}>Create a dead-man's switch to protect your digital legacy.</p>
                                </div>
                            ) : switches.map(dms => {
                                const status = deadManSwitchService.getStatus(dms);
                                return (
                                    <div key={dms.id} className="glass-card p-6 border-l-4 border-l-red-500 transition-all hover:-translate-y-1">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className={`text-xl font-bold ${textPrimary} truncate`}>{dms.name}</h3>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[status.status]}`}>
                                                        {status.status}
                                                    </span>
                                                </div>
                                                <p className={`text-sm ${textMuted} mb-4`}>
                                                    Recipient: <span className="font-medium">{dms.recipients[0]?.email || 'None'}</span>
                                                </p>
                                                <div className={`p-3 rounded-lg text-xs flex flex-wrap gap-x-6 gap-y-2 ${isDark ? 'bg-black/20' : 'bg-gray-100/50'}`}>
                                                    <div><span className={textMuted}>Interval:</span> <strong className={textPrimary}>{dms.checkInIntervalDays} days</strong></div>
                                                    <div><span className={textMuted}>Last Check:</span> <strong className={textPrimary}>{new Date(dms.lastCheckIn).toLocaleDateString()}</strong></div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-start md:items-end justify-between border-t md:border-t-0 md:border-l border-gray-700/20 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                                                <div className="w-full text-left md:text-right mb-4">
                                                    <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${textMuted}`}>Time Remaining</p>
                                                    <p className={`text-2xl font-bold ${status.status === 'safe' ? 'text-green-500' : status.status === 'warning' ? 'text-yellow-500' : 'text-red-500'}`}>
                                                        {status.timeRemaining}
                                                    </p>
                                                    <div className="w-full h-2 rounded-full bg-gray-700/30 mt-3 overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-1000 ${status.percentRemaining > 50 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : status.percentRemaining > 20 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
                                                            style={{ width: `${status.percentRemaining}%` }} />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full justify-end mt-auto">
                                                    {!dms.isTriggered && (
                                                        <button onClick={() => handleCheckIn(dms.id)} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold shadow-lg shadow-green-500/20 transition-all">
                                                            <RefreshCw className="h-4 w-4" /> Check In
                                                        </button>
                                                    )}
                                                    <button onClick={() => { deadManSwitchService.delete(dms.id); setSwitches(deadManSwitchService.getAll()); }}
                                                        className={`p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors`} aria-label="Delete">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
