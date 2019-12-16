import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'app-language',
    templateUrl: './language.page.html',
    styleUrls: ['./language.page.scss'],
})
export class LanguagePage implements OnInit {

    constructor(private modalController: ModalController) { }

    ngOnInit() {
    }

    closemodal() {
        this.modalController.dismiss({
            'dismissed': true
        });        
    }

    choseLanguage(language) {
        this.modalController.dismiss({
            'language': language
        });
    }
}
