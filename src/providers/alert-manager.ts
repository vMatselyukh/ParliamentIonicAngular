import { Injectable } from '@angular/core';
import { AlertController, Platform } from '@ionic/angular';
import { LanguageManager } from '../providers/providers';

@Injectable()
export class AlertManager {

    isIos: boolean = false;

    constructor(private alertController: AlertController,
        private languageManager: LanguageManager,
        private platform: Platform) {
            if(this.platform.is('ios')){
                this.isIos = true;
            }

    }

    async showNoCoinsAlert(confirmCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("get_coins_by_watching_video"),
            buttons: [
                {
                    text: await this.languageManager.getTranslations("watch"),
                    handler: confirmCallback
                },
                {
                    text: await this.languageManager.getTranslations("cancel"),
                    role: 'cancel',
                    cssClass: 'secondary'
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
                    text: await this.languageManager.getTranslations("watch"),
                    handler: confirmCallback
                },
                {
                    text: await this.languageManager.getTranslations("cancel"),
                    role: 'cancel',
                    cssClass: 'secondary'
                } 
            ]
        });

        await alert.present();
    }

    async showAddLoadingAlert() {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("rewarded_video_is_loading"),
            backdropDismiss: true
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
                    text: await this.languageManager.getTranslations("yes"),
                    handler: confirmCallback
                },
                {
                    text: await this.languageManager.getTranslations("no"),
                    role: 'cancel',
                    cssClass: 'secondary'
                }
            ],
            backdropDismiss: true
        });

        await alert.present();
    }

    async showNoInternetAlert(confirmCallback: any, exitAppCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("internet_connection_needed_to_download_content"),
            backdropDismiss: false
        });

        if(this.isIos) {
            alert.buttons = [
                {
                    text: await this.languageManager.getTranslations("ok"),
                    handler: confirmCallback
                }
            ];
        }
        else {
            alert.buttons = [
                {
                    text: await this.languageManager.getTranslations("ok"),
                    handler: confirmCallback
                },
                {
                    text: await this.languageManager.getTranslations("exit_from_app"),
                    handler: exitAppCallback
                }
            ];
        }

        await alert.present();
    }

    async showPlainNoInternetMessage() {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("no_internet"),
            buttons: [
                {
                    text: await this.languageManager.getTranslations("ok"),
                    role: 'cancel'
                }
            ],
            backdropDismiss: true,
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
            ],
            backdropDismiss: true
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
                    text: await this.languageManager.getTranslations("yes"),
                    handler: confirmCallback
                },
                {
                    text: await this.languageManager.getTranslations("later"),
                    handler: laterCallback
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
                    text: await this.languageManager.getTranslations("yes"),
                    handler: confirmCallback
                },
                {
                    text: await this.languageManager.getTranslations("no"),
                    role: 'cancel'
                }
            ]
        });

        await alert.present();
    }

    async showNoConfigAlert(confirmCallback: any, postponeCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("no_config_first_time_loading"),
            backdropDismiss: false
        });

        alert.buttons = [
            {
                text: await this.languageManager.getTranslations("ok"),
                handler: confirmCallback
            },
            {
                text: await this.languageManager.getTranslations("later"),
                handler: postponeCallback
            }
        ];
        
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

    async showSomeFilesWereNotDownloadedAlert() {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: await this.languageManager.getTranslations("some_files_were_not_downloaded_alert"),
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