import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ParliamentApi, DbContext, AlertManager, LanguageManager } from '../../providers/providers';
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
    translations: any = null;

    constructor(public formBuilder: FormBuilder,
        private parliamentApi: ParliamentApi,
        private modalController: ModalController,
        private dbContext: DbContext,
        private network: Network,
        private alertManager: AlertManager,
        private languageManager: LanguageManager) {

        this.dbContext.getUserGuid().then(guid => {
            this.proposeQuoteModel = new ProposeQuote("", guid);
        }).catch(exception => {
            console.log("propose-quote", exception);
        });

        (async () => {
            this.translations = {
                "politician_name": await this.languageManager.getTranslations("politician_name"),
                "add_quote": await this.languageManager.getTranslations("add_quote"),
                "quote": await this.languageManager.getTranslations("quote"),
                "quote_is_required": await this.languageManager.getTranslations("quote_is_required"),
                "url": await this.languageManager.getTranslations("url"),
                "close": await this.languageManager.getTranslations("close"),
                "send": await this.languageManager.getTranslations("send")
            }
        })();
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
                .catch(async e => {
                    let errorMessage = await this.languageManager.getTranslations("error_happened_sorry");

                    this.modalController.dismiss({
                        'submitted': false,
                        'error': errorMessage
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
