import { DbContext } from '../providers/providers';

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LanguageManager {
    languageIndex: number = 1;

    translations = {
        "ua": {
            "list": "Список",
            "propose_quotes": "",
            "get_coins": "",
            "update_config": "",
            "language": "",
            "put_mark": "",
            "share_in_fb": "",
            

            "close": "",
            "politician_name": "",
            "quote": "",
            "quote_is_required": "",
            "url": "",
            "send": "",
            "thank_you": "",
            "menu": "",
            
            "cancel": "",
            "watch": "",
            "get_coins_by_watching_video": "",
            
            "check_for_updates_no_content": "Новий контент не знайдено. Для провірки конфігурації чи відновлення файлів натисніть Так.",
            "yes": "Так",
            "no": "Ні",
            "ok": "Ок",
            "exit": "Вихід",
            "exit_from_app": "Вихід з додатку",
            "no_config_first_time_loading": "При першому запуску додатку потрібно завантажити файл конфігурації та контент. Підключіться до мережі інтернет та натисність 'Ок' щоб розпочати завантаження файлів.",
            "attention": "Увага",
        },
        "ru": {
            "check_for_updates_no_content": "Новый контент не найден. Для проверки конфигурации или восстановления файлов нажмите Да.",
            "yes": "Да",
            "no": "Нет",
            "ok": "Ок",
            "exit": "Выход",
            "exit_from_app": "Выход из приложения",
            "no_config_first_time_loading": "При первом запуске приложения необходимо загрузить файл конфигурации и контент. Подключитесь к сети интернет и нажмите 'Ок' чтобы начать загрузку файлов.",
            "attention": "Внимание",
        }
    }

    constructor(private dbContext: DbContext ) {

    }

    async getTranslations(key: string) {
        let currentLanguage = await this.dbContext.getLanguage();

        return this.translations[currentLanguage][key];
    }
}