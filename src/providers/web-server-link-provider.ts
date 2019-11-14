import { Injectable } from '@angular/core';

@Injectable()
export class WebServerLinkProvider {
    webServerBaseUrl: string = "http://localhost:2101/Api/Parliament/";//"http://1d063402-0ee0-4-231-b9ee.azurewebsites.net/Api/Parliament/";
}