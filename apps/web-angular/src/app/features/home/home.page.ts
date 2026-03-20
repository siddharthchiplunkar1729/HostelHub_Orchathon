import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page animate-fade-in-up">

      <!-- ── Hero ── -->
      <section class="home-hero">
        <!-- Animated blobs -->
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>

        <div class="home-hero-content">
          <div class="eyebrow">🏠 Elite Campus Housing Network</div>
          <h1 class="home-title">
            Smart Living for<br>
            <span class="gradient-text">Modern Students</span>
          </h1>
          <p class="home-subtitle">
            The ultimate platform for university housing. Secure, verified, and community-driven
            residences designed for academic success.
          </p>
          <div class="actions-row">
            <a class="btn" routerLink="/search">Explorer Map →</a>
            <a class="btn ghost" routerLink="/auth/signup">Get Started</a>
          </div>

          <!-- Social proof -->
          <div class="social-proof animate-fade-in-up" style="animation-delay: 0.2s;">
            <div class="avatar-stack">
              <div class="avatar" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); border: 3px solid rgba(255,255,255,0.4);">S</div>
              <div class="avatar" style="background: linear-gradient(135deg, #10b981, #3b82f6); border: 3px solid rgba(255,255,255,0.4);">A</div>
              <div class="avatar" style="background: linear-gradient(135deg, #f59e0b, #ef4444); border: 3px solid rgba(255,255,255,0.4);">R</div>
              <div class="avatar" style="background: linear-gradient(135deg, #8b5cf6, #ec4899); border: 3px solid rgba(255,255,255,0.4);">M</div>
            </div>
            <div class="social-proof-text">
              <strong>2,400+</strong> Students found their<br>perfect room this semester
            </div>
          </div>
        </div>

        <!-- Stats float card -->
        <div class="hero-float-card animate-float">
          <div class="hero-float-icon">✓</div>
          <div>
            <div style="font-weight:800;font-size:1rem;color:var(--text)">Verified</div>
            <div class="muted" style="font-size:0.8rem">100% Quality Assurance</div>
          </div>
        </div>
      </section>

      <!-- ── Role cards ── -->
      <section class="grid two">
        <article class="role-card role-card--student">
          <div class="role-icon" style="background:var(--primary-light);color:var(--primary)">👩‍🎓</div>
          <h3>For Students</h3>
          <p class="muted">Search through thousands of verified rooms, virtual tours, and student reviews.</p>
          <a class="role-link" routerLink="/search">Browse Listings →</a>
        </article>

        <article class="role-card role-card--warden">
          <div class="role-icon" style="background:var(--secondary-light);color:var(--secondary)">🏢</div>
          <h3>For Wardens</h3>
          <p class="muted">Manage your hostel blocks, track occupancy, and automate student approvals with ease.</p>
          <a class="role-link" style="color:var(--secondary)" routerLink="/auth/signup">Host a Block →</a>
        </article>
      </section>

      <!-- ── How it works ── -->
      <section class="card" style="padding: 44px 36px;">
        <div style="text-align:center;margin-bottom:40px">
          <h2 style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:900;letter-spacing:-0.03em;margin:0 0 10px">
            Housing made <span style="color:var(--primary)">effortless.</span>
          </h2>
          <p class="muted">Three steps to your elite campus residence.</p>
        </div>
        <div class="grid three animate-stagger">
          <div class="step-card">
            <div class="step-icon" style="background:var(--primary)">🔍</div>
            <h3>Find &amp; Compare</h3>
            <p class="muted">Browse hundreds of verified hostels with real student reviews.</p>
          </div>
          <div class="step-card">
            <div class="step-icon" style="background:var(--secondary)">🔒</div>
            <h3>Apply Securely</h3>
            <p class="muted">Submit applications directly. Safe, digital, and 100% transparent.</p>
          </div>
          <div class="step-card">
            <div class="step-icon" style="background:var(--accent)">🏠</div>
            <h3>Move In</h3>
            <p class="muted">Get accepted and move into your new home. Academic success follows.</p>
          </div>
        </div>
      </section>


      <!-- ── Quality strip ── -->
      <section class="quality-strip">
        <div>
          <strong style="font-size:1.1rem;font-weight:900;letter-spacing:-0.03em">HOSTELHUB</strong>
          <p class="muted" style="font-size:0.82rem;margin-top:4px">Ensuring student stability across 500+ campus networks.</p>
        </div>
        <div class="quality-badges">
          <div class="quality-badge"><span>ISO 9001:2023</span><small>Operationally Certified</small></div>
          <div class="quality-badge"><span>AES 256-BIT</span><small>Security Encryption</small></div>
          <div class="quality-badge"><span>24/7 REDLINE</span><small>Priority Support</small></div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    /* Hero */
    .home-hero {
      position: relative;
      padding: 64px 48px;
      border-radius: var(--radius-2xl);
      background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 45%, #059669 100%);
      color: white;
      overflow: hidden;
      box-shadow: 0 24px 72px rgba(29,78,216,0.28);
    }
    .blob {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      animation: pulse-slow 5s ease-in-out infinite;
    }
    .blob-1 { width:400px;height:400px;top:-120px;left:-80px;background:radial-gradient(circle,rgba(255,255,255,0.08),transparent 65%); }
    .blob-2 { width:350px;height:350px;bottom:-100px;right:-60px;background:radial-gradient(circle,rgba(255,255,255,0.06),transparent 65%);animation-delay:1.5s; }
    .blob-3 { width:250px;height:250px;top:30%;right:15%;background:radial-gradient(circle,rgba(15,118,110,0.12),transparent 65%);animation-delay:3s; }

    .home-hero-content { position:relative;z-index:1;max-width:680px; }

    .home-title {
      font-size: clamp(2.2rem, 5vw, 4rem);
      font-weight: 900;
      line-height: 1.02;
      letter-spacing: -0.04em;
      margin: 0 0 20px;
    }
    .gradient-text {
      background: linear-gradient(90deg, #38bdf8, #a5f3fc, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .home-subtitle {
      font-size: 1.1rem;
      font-weight: 500;
      color: rgba(255,255,255,0.82);
      max-width: 520px;
      line-height: 1.65;
      margin: 0 0 28px;
    }

    /* Social proof */
    .social-proof { display:flex;align-items:center;gap:16px;margin-top:28px; }
    .avatar-stack { display:flex; }
    .avatar-stack .avatar {
      width:40px;height:40px;border-radius:50%;border:3px solid rgba(255,255,255,0.3);
      font-size:0.85rem;margin-left:-10px;
    }
    .avatar-stack .avatar:first-child { margin-left:0; }
    .social-proof-text { font-size:0.85rem;color:rgba(255,255,255,0.8);line-height:1.4; }
    .social-proof-text strong { color:white; }

    /* Float card */
    .hero-float-card {
      position:absolute;bottom:32px;right:32px;
      background:rgba(255,255,255,0.7);
      backdrop-filter:blur(24px) saturate(200%);
      -webkit-backdrop-filter:blur(24px) saturate(200%);
      padding:20px 24px;
      border-radius:24px;
      display:flex;align-items:center;gap:16px;
      box-shadow:0 16px 40px rgba(0,0,0,0.15);
      border:1px solid rgba(255,255,255,1);
    }
    .hero-float-icon {
      width:44px;height:44px;border-radius:14px;
      background:linear-gradient(135deg,var(--secondary),#059669);
      color:white;display:flex;align-items:center;justify-content:center;
      font-size:1.2rem;font-weight:900;box-shadow:0 6px 16px rgba(15,118,110,0.35);
    }

    /* Role cards */
    .role-card {
      background:white;padding:40px 36px;border-radius:var(--radius-2xl);
      border:2px solid transparent;box-shadow:var(--shadow-sm);
      transition:all 0.3s;
    }
    .role-card:hover { box-shadow:var(--shadow-lg);transform:translateY(-4px); }
    .role-card--student:hover { border-color:rgba(29,78,216,0.12); }
    .role-card--warden:hover  { border-color:rgba(15,118,110,0.12); }
    .role-icon { width:72px;height:72px;border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:24px;transition:transform 0.3s; }
    .role-card:hover .role-icon { transform:scale(1.1); }
    .role-card h3 { font-size:1.5rem;font-weight:900;letter-spacing:-0.03em;margin:0 0 12px; }
    .role-card p  { margin:0 0 24px;line-height:1.6; }
    .role-link { font-weight:800;color:var(--primary);font-size:0.875rem;letter-spacing:0.05em;text-transform:uppercase;transition:letter-spacing 0.2s; }
    .role-link:hover { letter-spacing:0.1em; }

    /* Steps */
    .step-card { text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px; }
    .step-icon { width:80px;height:80px;border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;font-size:2rem;color:white;box-shadow:var(--shadow);flex-shrink:0;transition:transform 0.3s; }
    .step-card:hover .step-icon { transform:rotate(6deg) scale(1.05); }
    .step-card h3 { font-size:1.1rem;font-weight:800;letter-spacing:-0.02em;margin:0; }

    /* Quality strip */
    .quality-strip {
      display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:24px;
      background:white;border:1px solid var(--border);border-radius:var(--radius-lg);
      padding:28px 32px;box-shadow:var(--shadow-sm);
    }
    .quality-badges { display:flex;gap:32px;flex-wrap:wrap; }
    .quality-badge { display:flex;flex-direction:column;gap:2px;text-align:center; }
    .quality-badge span { font-weight:900;font-size:0.85rem;color:var(--text);letter-spacing:0.05em; }
    .quality-badge small { font-size:0.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em; }
  `]
})
export class HomePageComponent {}
