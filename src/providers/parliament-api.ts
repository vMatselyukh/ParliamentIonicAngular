import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Config } from '../models/models';
import { WebServerLinkProvider } from '../providers/providers';

@Injectable()
export class ParliamentApi {
    //private baseUrl = "http://localhost:2101/Api/Parliament/";
    private baseUrl = this.linkProvider.webServerBaseUrl; //"http://11fa7543-0ee0-4-231-b9ee.azurewebsites.net/Api/Parliament/";
    private clockServiceUrl = "https://worldclockapi.com/api/json/utc/now";
    

    constructor(private http: HttpClient,
                private linkProvider: WebServerLinkProvider) {
    }

    getConfig() : Promise<Config> {
        return new Promise((resolve, reject) => {
            this.http.get(this.baseUrl + "getconfig")
            .subscribe(
                (data) => {
                    resolve(data as Config);
                },
                (error) => {
                    reject(error);
                });
        });
    }

    getConfigHash(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.http.get(this.baseUrl + "getconfighash")
                .subscribe(
                    (data) => {
                        resolve(data as string);
                    },
                    (error) => {
                        reject(error);
                    });
        });
    }

    getFileByUrl(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.http.get(this.baseUrl + "getFile?url="+ url, {}).subscribe(
                (data) => {
                    var obj = data as Config;
                    resolve("");
                },
                (error) => {
                    reject(error);
                });
        });
    }

    postProposedQuote(qoute): Promise<void> {
        return new Promise((resolve, reject) => {
            this.http.post(this.baseUrl + "postProposedQuotes", qoute).subscribe(
                (data) => {
                    console.log(data);
                    resolve();
                },
                (error) => {
                    reject(error);
                });
        });
    }

    getCurrentDateTime(): Promise<Date> {
        return new Promise((resolve, reject) => {
            this.http.get(this.baseUrl + "gettimeutc").subscribe(
                (data: string) => {
                    resolve(new Date(data));
                },
                (error) => {
                    reject(error);
                }
            )
        });
    }
}