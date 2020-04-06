import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { LoadingController } from '@ionic/angular';
import { LanguageManager } from './language-manager';

@Injectable()
export class LoadingManager {
    constructor(private loadingController: LoadingController,
        private languageManager: LanguageManager, ) {
    }

    async showConfigLoadingMessage(): Promise<HTMLIonLoadingElement> {
        let loading = await this.loadingController.create({
            message: await this.languageManager.getTranslations("config_loading_wait_please"),
        });

        loading.present();

        return loading;
    }

    async closeLoading() {
        await this.loadingController.dismiss(); 
    }
}