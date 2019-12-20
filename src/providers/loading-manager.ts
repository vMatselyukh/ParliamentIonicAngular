import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { LoadingController } from '@ionic/angular';

@Injectable()
export class LoadingManager {
    constructor(private loadingController: LoadingController) {
    }

    async showConfigLoadingMessage() {
        let loading = await this.loadingController.create({
            message: 'Завантажується конфігурація. Будь ласка зачекайте.',
        });

        loading.present();
    }

    closeLoading() {
        this.loadingController.dismiss()  
    }
}