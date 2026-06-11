'use client';

import { useState } from 'react';
import { ArrowRight, User, Server, Lock, Key } from 'lucide-react';

interface FlowStep {
  id: number;
  title: string;
  from: string;
  to: string;
  description: string;
  icon: any;
  details: string;
  color: string;
}

const FLOW_STEPS: FlowStep[] = [
  { id: 1, title: '1. Authorization Request', from: 'Client App', to: 'Authorization Server', description: 'User clicks "Login with Google / GitHub"', icon: User, details: 'GET /authorize?response_type=code&client_id=...&redirect_uri=...&scope=...&state=...', color: 'var(--accent-orange)' },
  { id: 2, title: '2. User Consent', from: 'Authorization Server', to: 'User (Browser)', description: 'User logs in and approves permissions', icon: Lock, details: 'Login screen → "Allow access to your email and profile"', color: 'var(--accent-cyan)' },
  { id: 3, title: '3. Authorization Code', from: 'Authorization Server', to: 'Client App', description: 'Server redirects back with temporary code', icon: Key, details: 'redirect_uri?code=AUTH_CODE&state=...', color: 'var(--success)' },
  { id: 4, title: '4. Token Exchange', from: 'Client App', to: 'Authorization Server', description: 'Backend exchanges code + client_secret for tokens', icon: Server, details: 'POST /token { grant_type: "authorization_code", code, client_id, client_secret, redirect_uri }', color: 'var(--warning)' },
  { id: 5, title: '5. Access + Refresh Token', from: 'Authorization Server', to: 'Client App', description: 'Server returns short-lived access token + long-lived refresh token', icon: Key, details: '{ access_token, refresh_token, expires_in, token_type: "Bearer" }', color: 'var(--accent-orange)' },
  { id: 6, title: '6. Access Protected Resource', from: 'Client App', to: 'Resource Server (API)', description: 'Use access token to call protected endpoints', icon: Server, details: 'Authorization: Bearer <access_token>', color: 'var(--accent-cyan)' },
];

export default function OAuthFlowDiagrammer() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <main className="flex-1 max-w-[1100px] mx-auto w-full p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">OAuth 2.0 Authorization Code Flow</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Interactive diagram of the most secure OAuth 2.0 flow used by Google, GitHub, Discord, etc.</p>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 mb-6">
        <div className="flex flex-col gap-8">
          {FLOW_STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <div key={step.id} onClick={() => setActiveStep(isActive ? null : step.id)} className={`group cursor-pointer border rounded-2xl p-5 transition-all ${isActive ? 'border-[var(--accent-orange)] ring-1 ring-[var(--accent-orange)]/30' : 'border-[var(--border)] hover:border-[var(--text-muted)]/40'}`}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: step.color + '20', color: step.color }}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm mb-0.5">{step.title}</div>
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <span className="font-mono px-2 py-0.5 bg-[var(--bg-elevated)] rounded">{step.from}</span>
                      <ArrowRight size={14} className="text-[var(--text-muted)]" />
                      <span className="font-mono px-2 py-0.5 bg-[var(--bg-elevated)] rounded">{step.to}</span>
                    </div>
                    <div className="text-sm text-[var(--text-primary)]/90">{step.description}</div>
                    <div className="mt-3 text-[10px] font-mono bg-black/30 p-3 rounded-xl border border-[var(--border)] text-[var(--text-muted)]">{step.details}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
          <div className="font-bold mb-2 text-[var(--accent-cyan)]">Why Authorization Code Flow?</div>
          <ul className="space-y-1.5 text-xs text-[var(--text-muted)]">
            <li>• Most secure for web apps (no client secret exposed in browser)</li>
            <li>• Refresh tokens allow long-lived sessions</li>
            <li>• Supports PKCE for public clients (mobile/SPA)</li>
            <li>• Recommended by OAuth 2.1 spec</li>
          </ul>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
          <div className="font-bold mb-2 text-[var(--accent-orange)]">Important Security Notes</div>
          <ul className="space-y-1.5 text-xs text-[var(--text-muted)]">
            <li>• Never put client_secret in frontend code</li>
            <li>• Always validate state parameter (CSRF protection)</li>
            <li>• Use HTTPS everywhere</li>
            <li>• Short-lived access tokens + refresh flow</li>
          </ul>
        </div>
      </div>

      <div className="mt-5 text-center text-xs text-[var(--text-muted)]">
        Click any step above to highlight it. Built for educational purposes in Dev-ToolsBox.
      </div>
    </main>
  );
}
