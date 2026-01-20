import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthStatus } from './auth-status';

describe('AuthStatus', () => {
  let component: AuthStatus;
  let fixture: ComponentFixture<AuthStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthStatus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
