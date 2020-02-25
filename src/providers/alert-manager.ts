﻿import { Injectable } from '@angular/core';
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
            message: "У вас закінчились монети для розблокування фраз. Для отримання додаткових 10 монет потрібно переглянути короткий рекламний ролик.",
            buttons: [
                {
                    text: 'Скасувати',
                    role: 'cancel',
                    cssClass: 'secondary'
                }, {
                    text: 'Переглянути',
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
            message: "Рекламний ролик не підвантажився. Перевірте з'єднання з інтернетом",
            buttons: ['OK']
        });

        await alert.present();
    }

    async showGetCoinsAlert(confirmCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: "Отримати додаткових 10 монеток можна шляхом перегляду короткого рекламного ролику.",
            buttons: [
                {
                    text: 'Скасувати',
                    role: 'cancel',
                    cssClass: 'secondary'
                }, {
                    text: 'Переглянути',
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
            message: "Рекламний ролик підвантажується. Будь ласка, зачекайте."
        });

        await alert.present();
    }

    async showExitConfirmationAlert(confirmCallback: any) {
        const alert = await this.alertController.create({
            header: await this.languageManager.getTranslations("attention"),
            subHeader: '',
            message: "Ви впевнені що хочете вийти з додатку?",
            buttons: [
                {
                    text: 'Ні',
                    role: 'cancel',
                    cssClass: 'secondary'
                }, {
                    text: 'Так',
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
            message: "Для завантаження контенту потрібно підключення до інтернету. Підключіться до інтернету і натисніть Ок",
            buttons: [
                {
                    text: 'Вихід з додатку',
                    handler: exitAppCallback
                },
                {
                    text: 'Ок',
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
            message: "Для відправки фрази потрібно подключення до інтернету. Підключіться та спробуйте знову.",
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
            message: "Новий контент доступний для завантаження. Бажаєте розпочати завантаження?",
            buttons: [
                {
                    text: 'Не зараз',
                    handler: laterCallback
                },
                {
                    text: 'Так',
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
            subHeader: await this.languageManager.getTranslations("no_config_first_time_loading"),
            message: "При першому запуску додатку потрібно завантажити файл конфігурації та контент. Підключіться до мережі інтернет та натисність 'Ок' щоб розпочати завантаження файлів.",
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
                    text: 'Ок',
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