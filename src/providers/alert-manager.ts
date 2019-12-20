import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { AlertController } from '@ionic/angular';

@Injectable()
export class AlertManager {

    constructor(private alertController: AlertController) {
    }

    async showNoCoinsAlert(confirmCallback: any) {
        const alert = await this.alertController.create({
            header: 'Увага',
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
            header: 'Увага',
            subHeader: '',
            message: "Рекламний ролик не підвантажився. Перевірте з'єднання з інтернетом",
            buttons: ['OK']
        });

        await alert.present();
    }

    async showGetCoinsAlert(confirmCallback: any) {
        const alert = await this.alertController.create({
            header: 'Увага',
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
            header: 'Увага',
            subHeader: '',
            message: "Рекламний ролик підвантажується. Будь ласка, зачекайте."
        });

        await alert.present();
    }

    async showExitConfirmationAlert(confirmCallback: any) {
        const alert = await this.alertController.create({
            header: 'Увага',
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
            header: 'Увага',
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

    async showUpdateConfigAlert(confirmCallback: any, laterCallback: any) {
        const alert = await this.alertController.create({
            header: 'Увага',
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
            ]
        });

        await alert.present();
    }

    async showNoConfigAlert(confirmCallback: any, exitAppCallback: any) {
        const alert = await this.alertController.create({
            header: 'Увага',
            subHeader: '',
            message: "При першому запуску додатку потрібно завантажити файл конфігурації та контент. Підключіться до мережі інтернет та натисність 'Ок' щоб розпочати завантаження файлів.",
            buttons: [
                {
                    text: 'Вихід з додатку',
                    handler: exitAppCallback
                },
                {
                    text: 'Ок',
                    handler: confirmCallback
                }
            ],
            backdropDismiss: false
        });

        await alert.present();
    }

    closeAlerts() {
        this.alertController.dismiss();
    }
}