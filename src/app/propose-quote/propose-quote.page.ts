import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParliamentApi } from '../../providers/providers';
import { ModalController } from '@ionic/angular';


@Component({
  selector: 'app-propose-quote',
  templateUrl: './propose-quote.page.html',
  styleUrls: ['./propose-quote.page.scss'],
})
export class ProposeQuotePage implements OnInit {

  postQuotesForm;

  constructor(public formBuilder: FormBuilder,
    private parliamentApi: ParliamentApi,
    private modalController: ModalController) { }

  ngOnInit() {
    this.postQuotesForm = this.formBuilder.group({
      politicianName: '',
      quote: '',
      url: ''
    });
  }

  onSubmit(customerData) {
    // Process checkout data here
    this.parliamentApi.postProposedQuote(customerData);
    
    console.log('Your order has been submitted', customerData);



    this.postQuotesForm.reset();
  }

  closemodal(){
    this.modalController.dismiss({
      'dismissed': true
    });
  }
}
