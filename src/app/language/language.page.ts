import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { LanguageManager } from '../../providers/providers';

@Component({
    selector: 'app-language',
    templateUrl: './language.page.html',
    styleUrls: ['./language.page.scss'],
})
export class LanguagePage {

    translations: any = null;

    constructor(private modalController: ModalController,
        private languageManager: LanguageManager) {

        (async () => {
            this.translations = {
                "chose_ui_language": await this.languageManager.getTranslations("chose_ui_language"),
                "close": await this.languageManager.getTranslations("close")
            }
        })();
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
