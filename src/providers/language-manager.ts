import { DbContext } from '../providers/providers';

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LanguageManager {
    languageIndex: number = 1;

    translations = {
        "ua": {
            "check_for_updates_no_content": "Новий контент не знайдено. Для провірки конфігурації чи відновлення файлів натисніть Так.",
            "yes": "Так",
            "no": "Ні",
            "ok": "Ок",
            "exit": "Вихід",
            "exit_from_app": "Вихід з додатку",
            "no_config_first_time_loading": "При першому запуску додатку потрібно завантажити файл конфігурації та контент. Підключіться до мережі інтернет та натисність Ок щоб розпочати завантаження файлів.",
            "attention": "Увага",
            "get_coins_by_watching_video": "У вас закінчились монетки для розблокування фраз. Для отримання додаткових 10 монеток потрібно переглянути короткий рекламний ролик.",
            "cancel": "Скасувати",
            "watch": "Переглянути",
            "adv_not_loaded": "Рекламний ролик не підвантажився. Перевірте з'єднання з інтернетом.",
            "get_coins_by_wathing_video_menu": "Отримати додаткових 10 монеток можна шляхом перегляду короткого рекламного ролика.",
            "rewarded_video_is_loading": "Рекламний ролик підвантажується. Будь ласка, зачекайте.",
            "are_you_sure_you_want_to_quit": "Ви впевнені що хочете вийти з додатку?",
            "internet_connection_needed_to_download_content": "Для завантаження контенту потрібно підключення до інтернету. Підключіться до інтернету і натисніть Ок.",
            "internet_connection_needed_to_post_quote": "Для відправки фрази потрібно подключення до інтернету. Підключіться та спробуйте знову.",
            "new_content_is_ready_for_downloading": "Новий контент доступний для завантаження. Бажаєте розпочати завантаження?",
            "later": "Не зараз",
            "propose_quotes": "Додати вислів",
            "check_for_updates": "Завантажити оновлення",
            "get_coins": "Отримати монетки",
            "chose_languge": "Вибір мови",
            "put_mark_for_app": "Оцінити додаток",
            "share_in_fb": "Поширити у фейсбук",
            "chose_ui_language": "Оберіть мову інтерфейсу",
            "close": "Закрити",
            "politician_name": "Ім'я політика",
            "add_quote": "Додати цитату",
            "quote": "Цитата",
            "quote_is_required": "Цитата є обов'язковим полем",
            "url": "Веб посилання",
            "send": "Відправити",
            "menu": "Меню",
            "error_happened_sorry": "Сталась помилка. Вибачте за незручності.",
            "share_text": "Мобільний додаток Верховна рада України",
            "thank_you": "Дякую!",
            "list": "Список",
            "config_updated": "Конфігурацію оновлено",
            "postponed": "Відкладено",
            "nothing_to_update": "Немає контенту для оновлення",
            "no_internet": "Немає підключення до інтернету",
            "config_loading_wait_please": "Завантажується конфігурація. Будь ласка, зачекайте. Завантажено {0}%",
            "config_applying_wait_please": "Застосовується конфігурація. Будь ласка, зачекайте.",
            "config_copying_files": "Копіюються файли. Будь ласка, зачекайте.",
            "config_files_being_prepared": "Формується архів для завантаження. Будь ласка, зачекайте.",
            "some_files_were_not_downloaded_alert": "Деякі файли не підвантажились. Щоб виправити ситуацію зайдіть у меню та виберіть пункт 'Завантажити оновлення'"
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
            "get_coins_by_watching_video": "У вас закончились монетки для разблокировки фраз. Для получения дополнительных 10 монеток нужно пересмотреть короткий рекламный ролик.",
            "cancel": "Отменить",
            "watch": "Посмотреть",
            "adv_not_loaded": "Рекламный ролик не подгрузился. Проверьте соединение с интернетом.",
            "get_coins_by_wathing_video_menu": "Получить дополнительные 10 монет можно путем просмотра короткого рекламного ролика.",
            "rewarded_video_is_loading": "Рекламный ролик подгружается. Пожалуйста, подождите.",
            "are_you_sure_you_want_to_quit": "Вы уверены, что хотите выйти из приложения?",
            "internet_connection_needed_to_download_content": "Для загрузки контента требуется подключение к интернету. Подключитесь к интернету и нажмите Ок.",
            "internet_connection_needed_to_post_quote": "Для отправки фразы нужно подключение к интернету.Подключитесь и попробуйте снова.",
            "new_content_is_ready_for_downloading": "Новый контент доступен для загрузки. Хотите начать загрузку?",
            "later": "Не сейчас",
            "propose_quotes": "Добавить фразу",
            "check_for_updates": "Cкачать обновление",
            "get_coins": "Получить монетки",
            "chose_languge": "Выбор языка",
            "put_mark_for_app": "Оценить приложение",
            "share_in_fb": "Поделиться в фейсбук",
            "chose_ui_language": "Выберите язык интерфейса",
            "close": "Закрыть",
            "politician_name": "Имя политика",
            "add_quote": "Добавить цитату",
            "quote": "Цитата",
            "quote_is_required": "Цитата является обязательным полем",
            "url": "Веб cсылка",
            "send": "Отправить",
            "menu": "Меню",
            "error_happened_sorry": "Произошла ошибка. Извините за неудобства.",
            "share_text": "Мобильное приложение Верховная Рада Украины",
            "thank_you": "Спасибо!",
            "list": "Список",
            "config_updated": "Конфигурацию обновлено",
            "postponed": "Отложено",
            "nothing_to_update": "Нет контента для обновления",
            "no_internet": "Нет подключения к интернету",
            "config_loading_wait_please": "Загружается конфигурация. Пожалуйста, подождите. Загружено {0}%",
            "config_applying_wait_please": "Применяется конфигурация. Пожалуйста, подождите.",
            "config_copying_files": "Копируются файлы.Пожалуйста подождите.",
            "config_files_being_prepared": "Формируется архив для загрузки. Пожалуйста, подождите.",
            "some_files_were_not_downloaded_alert": "Некоторые файлы не подгрузились. Чтобы исправить ситуацию зайдите в меню и выберите пункт 'Загрузить обновление'"
        }
    }

    constructor(private dbContext: DbContext ) {

    }

    async getTranslations(key: string) {
        let currentLanguage = await this.dbContext.getLanguage();

        return this.translations[currentLanguage][key];
    }

    async formatTranslations(key: string, ...args) {
        let currentLanguage = await this.dbContext.getLanguage();

        let translationString: string = this.translations[currentLanguage][key];

        for (let i = 0; i < args.length; i++) {
            translationString = translationString.replace("{" + i + "}", args[i]);
        }

        return translationString;
    }
}