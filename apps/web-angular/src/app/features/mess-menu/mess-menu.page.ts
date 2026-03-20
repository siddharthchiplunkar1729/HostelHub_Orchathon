import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OperationsService } from '../../core/services/operations.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <section class="hero-card">
        <div class="eyebrow">Mess menu</div>
        <h1>Weekly dining schedule.</h1>
      </section>

      <section class="cards-grid" *ngIf="menu?.menus?.length; else singleOrEmpty">
        <article class="card" *ngFor="let day of menu.menus">
          <h2>{{ day.day }}</h2>
          <div class="list">
            <div><strong>Breakfast:</strong> {{ day.breakfast || day.meals?.[0]?.items?.join(', ') || 'Pending' }}</div>
            <div><strong>Lunch:</strong> {{ day.lunch || day.meals?.[1]?.items?.join(', ') || 'Pending' }}</div>
            <div><strong>Dinner:</strong> {{ day.dinner || day.meals?.[3]?.items?.join(', ') || 'Pending' }}</div>
          </div>
        </article>
      </section>

      <ng-template #singleOrEmpty>
        <section class="card" *ngIf="menu; else empty">
          <h2>Menu response</h2>
          <pre>{{ menu | json }}</pre>
        </section>
      </ng-template>

      <ng-template #empty>
        <div class="empty-state">No mess menu data is available yet.</div>
      </ng-template>
    </div>
  `
})
export class MessMenuPageComponent {
  private readonly operationsService = inject(OperationsService);

  menu: any = null;

  constructor() {
    this.operationsService.getWeeklyMessMenu().subscribe({
      next: (data) => {
        this.menu = data;
      },
      error: () => {
        this.menu = null;
      }
    });
  }
}
