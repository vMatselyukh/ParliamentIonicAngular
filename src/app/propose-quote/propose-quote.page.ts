import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ParliamentApi } from '../../providers/providers';
import { ModalController } from '@ionic/angular';
import { ProposeQuote } from '../../models/propose-quote';

@Component({
    selector: 'app-propose-quote',
    templateUrl: './propose-quote.page.html',
    styleUrls: ['./propose-quote.page.scss'],
})
export class ProposeQuotePage implements OnInit {

    proposeQuoteModel = new ProposeQuote("");

    constructor(public formBuilder: FormBuilder,
        private parliamentApi: ParliamentApi,
        private modalController: ModalController) { }

    ngOnInit() {
    }

    onSubmit() {
        //this.parliamentApi.postProposedQuote(this.proposeQuoteModel);
        
        this.modalController.dismiss({
            'submitted': true
        });

        this.proposeQuoteModel = new ProposeQuote("");
    }

    closemodal() {
        this.modalController.dismiss({
            'dismissed': true
        });

        //
    }
}
