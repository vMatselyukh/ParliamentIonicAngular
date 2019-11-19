import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProposeQuotePage } from './propose-quote.page';

describe('ProposeQuotePage', () => {
  let component: ProposeQuotePage;
  let fixture: ComponentFixture<ProposeQuotePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProposeQuotePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProposeQuotePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
