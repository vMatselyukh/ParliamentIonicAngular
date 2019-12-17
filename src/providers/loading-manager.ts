import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { LoadingController } from '@ionic/angular';

@Injectable()
export class LoadingManager {

    constructor(private loadingController: LoadingController) {
    }

    async showConfigLoadingMessage() {
        const loading = await this.loadingController.create({
            message: 'Завантажується конфігурація. Будь ласка зачекайте.',
        });
        await loading.present();
    }

    closeLoading() {
        this.loadingController.dismiss();
    }
}