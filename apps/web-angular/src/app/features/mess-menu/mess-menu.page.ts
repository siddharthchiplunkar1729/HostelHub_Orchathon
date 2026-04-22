import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OperationsService } from '../../core/services/operations.service';
import { AuthService } from '../../core/services/auth.service';

interface MessMenuDay {
  _id?: string;
  day: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
  hostelBlockId?: string;
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <section class="hero-card" style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; border-radius: var(--radius-2xl); padding: 48px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -30px; right: -20px; font-size: 12rem; opacity: 0.08; pointer-events: none;">🍽️</div>
        <div class="eyebrow" style="color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);">DINING</div>
        <h1 style="color: white; font-size: 2.5rem; letter-spacing: -0.04em; margin: 0 0 10px;">Weekly Mess Menu</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 0 0 24px; max-width: 480px;">
          Your hostel's complete weekly meal schedule — breakfast, lunch, snacks & dinner, all in one place.
        </p>
        <div class="actions-row">
          <a class="btn ghost" routerLink="/dashboard" style="background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); color: white;">Back to Dashboard</a>
        </div>
      </section>

      <!-- Day tabs -->
      <section class="card" style="padding: 16px 20px;" *ngIf="!loading()">
        <div style="display: flex; gap: 8px; flex-wrap: wrap; overflow-x: auto; padding-bottom: 4px;">
          <button
            *ngFor="let day of orderedDays()"
            class="filter-tab"
            [class.active]="activeDay() === day"
            (click)="activeDay.set(day)"
            [class.today-tab]="day === todayName">
            {{ day.slice(0, 3) }}
            <span *ngIf="day === todayName" style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); margin-left: 4px; vertical-align: middle;"></span>
          </button>
        </div>
      </section>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Loading dining schedule…</p>
      </div>

      <!-- Active day menu -->
      <ng-container *ngIf="!loading() && activeDayMenu() as menu">
        <section class="menu-day-header">
          <h2 style="margin: 0; font-size: 1.5rem; font-weight: 900; letter-spacing: -0.03em;">
            {{ menu.day }}
            <span class="badge success" *ngIf="menu.day === todayName" style="font-size: 0.7rem; vertical-align: middle; margin-left: 8px;">Today</span>
          </h2>
          <p class="muted" style="margin: 4px 0 0;">Full meal schedule for {{ menu.day }}</p>
        </section>

        <section class="meal-grid">
          <article class="meal-card" *ngFor="let meal of mealsOf(menu)" [class.current-meal]="meal.isCurrent">
            <div class="meal-icon-wrap">
              <span class="meal-icon">{{ meal.icon }}</span>
              <span class="meal-time">{{ meal.time }}</span>
            </div>
            <div class="meal-body">
              <div class="meal-label">{{ meal.label }}</div>
              <p class="meal-items" *ngIf="meal.items; else noItems">{{ meal.items }}</p>
              <ng-template #noItems>
                <p class="meal-items" style="color: var(--muted); font-style: italic;">Menu not posted yet</p>
              </ng-template>
            </div>
            <div class="current-meal-badge" *ngIf="meal.isCurrent">Current meal</div>
          </article>
        </section>
      </ng-container>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading() && !activeDayMenu()">
        <span class="icon">🍽️</span>
        <h2 style="font-size: 1.1rem; font-weight: 800; margin: 0 0 8px;">No menu for {{ activeDay() }}</h2>
        <p>The dining schedule for this day hasn't been posted by your hostel administration yet.</p>
      </div>

      <!-- Full week overview -->
      <section class="card" style="padding: 24px;" *ngIf="!loading() && weekMenus().length > 1">
        <h3 style="margin: 0 0 16px; font-size: 1.1rem; font-weight: 800;">Full Week Overview</h3>
        <div class="week-table-wrap">
          <table class="week-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>🌅 Breakfast</th>
                <th>☀️ Lunch</th>
                <th>🍎 Snacks</th>
                <th>🌙 Dinner</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of orderedMenus()" [class.today-row]="day.day === todayName">
                <td class="day-cell">{{ day.day.slice(0, 3) }}</td>
                <td>{{ day.breakfast || '—' }}</td>
                <td>{{ day.lunch || '—' }}</td>
                <td>{{ day.snacks || '—' }}</td>
                <td>{{ day.dinner || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .menu-day-header { margin-bottom: 16px; }

    .meal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .meal-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: var(--shadow-sm);
      position: relative;
      transition: all 0.2s;
    }
    .meal-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
    .meal-card.current-meal {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-light), var(--shadow);
    }

    .meal-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .meal-icon {
      font-size: 2.2rem;
      line-height: 1;
    }
    .meal-time {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .meal-body { flex: 1; }
    .meal-label {
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--primary);
      margin-bottom: 6px;
    }
    .meal-items {
      font-size: 0.9rem;
      line-height: 1.55;
      color: var(--text);
      margin: 0;
    }

    .current-meal-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: var(--primary);
      color: white;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 4px 8px;
      border-radius: var(--radius-full);
    }

    .today-tab { color: var(--success); font-weight: 800; }

    .week-table-wrap { overflow-x: auto; }
    .week-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .week-table th {
      text-align: left;
      padding: 10px 12px;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      border-bottom: 2px solid var(--border);
    }
    .week-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
      line-height: 1.4;
    }
    .week-table tr:last-child td { border-bottom: none; }
    .week-table .today-row td { background: var(--primary-light); }
    .week-table .day-cell { font-weight: 800; white-space: nowrap; }
  `]
})
export class MessMenuPageComponent {
  private readonly operationsService = inject(OperationsService);
  private readonly authService = inject(AuthService);

  readonly weekMenus = signal<MessMenuDay[]>([]);
  readonly loading = signal(true);

  readonly todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  readonly activeDay = signal<string>(this.todayName);

  readonly orderedDays = computed(() => {
    const available = new Set(this.weekMenus().map(m => m.day));
    const all = DAY_ORDER.filter(d => available.has(d));
    return all.length ? all : DAY_ORDER;
  });

  readonly orderedMenus = computed(() => {
    const map = new Map(this.weekMenus().map(m => [m.day, m]));
    return DAY_ORDER.map(d => map.get(d)).filter((m): m is MessMenuDay => !!m);
  });

  readonly activeDayMenu = computed(() =>
    this.weekMenus().find(m => m.day === this.activeDay()) ?? null
  );

  constructor() {
    const student = this.authService.currentStudent();
    this.operationsService.getWeeklyMessMenu().subscribe({
      next: (data: any) => {
        const menus: MessMenuDay[] = data?.menus ?? (Array.isArray(data) ? data : []);
        this.weekMenus.set(menus);
        // Jump to today if today has a menu, else first available
        const todayMenu = menus.find(m => m.day === this.todayName);
        if (todayMenu) {
          this.activeDay.set(this.todayName);
        } else if (menus.length) {
          this.activeDay.set(menus[0].day);
        }
        this.loading.set(false);
      },
      error: () => {
        this.weekMenus.set([]);
        this.loading.set(false);
      }
    });
  }

  mealsOf(menu: MessMenuDay) {
    const hour = new Date().getHours();
    return [
      { label: 'Breakfast', icon: '🌅', time: '7:00 – 9:30 AM', items: menu.breakfast, isCurrent: menu.day === this.todayName && hour >= 7 && hour < 10 },
      { label: 'Lunch',     icon: '☀️', time: '12:00 – 2:30 PM', items: menu.lunch,    isCurrent: menu.day === this.todayName && hour >= 12 && hour < 15 },
      { label: 'Snacks',    icon: '🍎', time: '5:00 – 6:30 PM',  items: menu.snacks,   isCurrent: menu.day === this.todayName && hour >= 17 && hour < 19 },
      { label: 'Dinner',    icon: '🌙', time: '7:30 – 9:30 PM',  items: menu.dinner,   isCurrent: menu.day === this.todayName && hour >= 19 && hour < 22 },
    ];
  }
}
