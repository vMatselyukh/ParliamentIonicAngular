﻿import { Injectable } from '@angular/core';
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

    closeAlerts() {
        this.alertController.dismiss();
    }
}