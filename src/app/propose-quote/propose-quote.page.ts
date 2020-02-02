import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ParliamentApi, DbContext, AlertManager } from '../../providers/providers';
import { ModalController } from '@ionic/angular';
import { ProposeQuote } from '../../models/propose-quote';
import { Network } from '@ionic-native/network/ngx';

@Component({
    selector: 'app-propose-quote',
    templateUrl: './propose-quote.page.html',
    styleUrls: ['./propose-quote.page.scss'],
})
export class ProposeQuotePage implements OnInit {

    proposeQuoteModel = new ProposeQuote("", "fakeGuid");

    constructor(public formBuilder: FormBuilder,
        private parliamentApi: ParliamentApi,
        private modalController: ModalController,
        private dbContext: DbContext,
        private network: Network,
        private alertManager: AlertManager) {

        this.dbContext.getUserGuid().then(guid => {
            this.proposeQuoteModel = new ProposeQuote("", guid);
        }).catch(exception => {
            console.log("propose-quote", exception);
        });
    }

    ngOnInit() {
    }

    onSubmit() {

        if (this.network.type != 'none') {
            this.parliamentApi.postProposedQuote(this.proposeQuoteModel)
                .then(() => {
                    this.modalController.dismiss({
                        'submitted': true
                    });
                })
                .catch(e => {
                    this.modalController.dismiss({
                        'submitted': false,
                        'error': e.error.Message
                    });

                    console.log("error posting quotes", e);
                });

            this.dbContext.getUserGuid().then(guid => {
                this.proposeQuoteModel = new ProposeQuote("", guid);
            }).catch(exception => {
                console.log("propose-quote", exception);
            });
        }
        else {
            this.alertManager.showInternetNeededForPostingQuotesAlert(() => { });
        }
        
    }

    closemodal() {
        this.modalController.dismiss({
            'dismissed': true
        });
    }
}
