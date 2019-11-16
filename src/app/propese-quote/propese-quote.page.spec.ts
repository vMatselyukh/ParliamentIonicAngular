import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PropeseQuotePage } from './propese-quote.page';

describe('PropeseQuotePage', () => {
  let component: PropeseQuotePage;
  let fixture: ComponentFixture<PropeseQuotePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PropeseQuotePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PropeseQuotePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
