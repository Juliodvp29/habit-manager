import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HabitDetailPage } from './habit-detail.page';

describe('HabitDetailPage', () => {
  let component: HabitDetailPage;
  let fixture: ComponentFixture<HabitDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HabitDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
