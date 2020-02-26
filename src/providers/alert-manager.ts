import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { AlertController } from '@ionic/angular';
import { LanguageManager } from '../providers/providers';

@Injectable()
export class AlertManager {

    constructor(private alertController: AlertController,
        private languageManager: LanguageManager) {
    }

    async showNoCoinsAlert(confirmCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("get_coins_by_watching_video"),
            buttons: [
                {
                    text: await this.languageManager.getTranslations("cancel"),
                    role: 'cancel',
                    cssClass: 'secondary'
                }, {
                    text: await this.languageManager.getTranslations("watch"),
                    handler: confirmCallback
                }
            ]
        });

        await alert.present();
    }

    async showAdNotAvailableAlert() {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("adv_not_loaded"), 
            buttons: ['OK']
        });

        await alert.present();
    }

    async showGetCoinsAlert(confirmCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("get_coins_by_wathing_video_menu"),
            buttons: [
                {
                    text: await this.languageManager.getTranslations("cancel"),
                    role: 'cancel',
                    cssClass: 'secondary'
                }, {
                    text: await this.languageManager.getTranslations("watch"),
                    handler: confirmCallback
                }
            ]
        });

        await alert.present();
    }

    async showAddLoadingAlert() {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("rewarded_video_is_loading")
        });

        await alert.present();
    }

    async showExitConfirmationAlert(confirmCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("are_you_sure_you_want_to_quit"),
            buttons: [
                {
                    text: await this.languageManager.getTranslations("no"),
                    role: 'cancel',
                    cssClass: 'secondary'
                }, {
                    text: await this.languageManager.getTranslations("yes"),
                    handler: confirmCallback
                }
            ]
        });

        await alert.present();
    }

    async showNoInternetAlert(confirmCallback: any, exitAppCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("internet_connection_needed_to_download_content"),
            buttons: [
                {
                    text: await this.languageManager.getTranslations("exit_from_app"),
                    handler: exitAppCallback
                },
                {
                    text: await this.languageManager.getTranslations("ok"),
                    handler: confirmCallback
                }
            ]
        });

        await alert.present();
    }

    async showInternetNeededForPostingQuotesAlert(confirmCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("internet_connection_needed_to_post_quote"),
            buttons: [
                {
                    text: 'Ок',
                    handler: confirmCallback
                }
            ]
        });

        await alert.present();
    }

    async showUpdateConfigAlert(confirmCallback: any, laterCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("new_content_is_ready_for_downloading"),
            buttons: [
                {
                    text: await this.languageManager.getTranslations("later"),
                    handler: laterCallback
                },
                {
                    text: await this.languageManager.getTranslations("yes"),
                    handler: confirmCallback
                }
            ],
            backdropDismiss: true
        });

        await alert.present();
    }

    async showRenewMissedFilesAlert(confirmCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("check_for_updates_no_content"),
            buttons: [
                {
                    text: await this.languageManager.getTranslations("no"),
                    role: 'cancel'
                },
                {
                    text: await this.languageManager.getTranslations("yes"),
                    handler: confirmCallback
                }
            ]
        });

        await alert.present();
    }

    async showNoConfigAlert(confirmCallback: any, exitAppCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("no_config_first_time_loading"),
            buttons: [
                {
                    text: await this.languageManager.getTranslations("exit_from_app"),
                    handler: exitAppCallback
                },
                {
                    text: await this.languageManager.getTranslations("ok"),
                    handler: confirmCallback
                }
            ],
            backdropDismiss: false
        });

        await alert.present();
    }

    async showInfoAlert(message: string) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: message,
            buttons: [
                {
                    text: await this.languageManager.getTranslations("ok"),
                    role: 'cancel'
                }
            ],
            backdropDismiss: true
        });

        await alert.present();
    }

    closeAlerts() {
        this.alertController.dismiss();
    }
}