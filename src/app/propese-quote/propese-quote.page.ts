import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-propese-quote',
  templateUrl: './propese-quote.page.html',
  styleUrls: ['./propese-quote.page.scss'],
})
export class PropeseQuotePage implements OnInit {

  constructor() { }

  ngOnInit() {
    this.myForm = new FormGroup({
      firstName: new FormControl('Josh'),
      lastName: new FormControl('Morony')
  });
  }

}
