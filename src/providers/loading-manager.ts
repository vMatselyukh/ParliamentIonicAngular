﻿import { Injectable } from '@angular/core';
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
            message: await this.languageManager.getTranslations("config_files_being_prepared")
        });

        loading.present();

        return loading;
    }

    async showUpdatesSearchMessage(): Promise<HTMLIonLoadingElement> {
        let loading = await this.loadingController.create({
            message: await this.languageManager.getTranslations("searching_updates")
        });

        await loading.present();

        return loading;
    }

    async closeLoading() {
        let topOverlay = await this.loadingController.getTop();
        if (topOverlay) {
            await this.loadingController.dismiss();
        }
    }

    async updateLoadingProgress(loadingElement: HTMLIonLoadingElement, percentage: number) {
        loadingElement.message = await this.languageManager.formatTranslations("config_loading_wait_please", percentage.toFixed(2));
    }

    async updateLoadingConfigurationIsBeingApplied(loadingElement: HTMLIonLoadingElement) {
        loadingElement.message = await this.languageManager.getTranslations("config_applying_wait_please");
    }

    async updateLoadingCopyingFiles(loadingElement: HTMLIonLoadingElement) {
        loadingElement.message = await this.languageManager.getTranslations("config_copying_files");
    }
}