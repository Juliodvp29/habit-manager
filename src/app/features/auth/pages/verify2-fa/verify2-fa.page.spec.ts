import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Verify2FaPage } from './verify2-fa.page';

describe('Verify2FaPage', () => {
  let component: Verify2FaPage;
  let fixture: ComponentFixture<Verify2FaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Verify2FaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
