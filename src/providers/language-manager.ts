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
            "exit": "",
            "close": "",
            "politician_name": "",
            "quote": "",
            "quote_is_required": "",
            "url": "",
            "send": "",
            "thank_you": "",
            "menu": "",
            "attention": "",
            "cancel": "",
            "watch": "",
            "get_coins_by_watching_video": "",
            "no_config_first_time_loading": ""
        },
        "ru": {

        }
    }
}