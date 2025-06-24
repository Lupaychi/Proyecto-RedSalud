import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAsignacionComponent } from './edit-asignacion.component';

describe('EditAsignacionComponent', () => {
  let component: EditAsignacionComponent;
  let fixture: ComponentFixture<EditAsignacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAsignacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditAsignacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
