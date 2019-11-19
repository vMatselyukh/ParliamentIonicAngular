import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-propose-quote',
  templateUrl: './propose-quote.page.html',
  styleUrls: ['./propose-quote.page.scss'],
})
export class ProposeQuotePage implements OnInit {

  postQuotesForm;

  constructor(public formBuilder: FormBuilder) { }

  ngOnInit() {
    this.postQuotesForm = this.formBuilder.group({
      name: '',
      quote: '',
      url: ''
    });
  }

  onSubmit(customerData) {
    // Process checkout data here
    console.log('Your order has been submitted', customerData);

    this.postQuotesForm.reset();
  }
}
