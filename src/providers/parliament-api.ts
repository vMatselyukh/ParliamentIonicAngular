import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Config } from '../models/models';
import { WebServerLinkProvider } from '../providers/providers';

@Injectable()
export class ParliamentApi {
    private baseUrl = this.linkProvider.webServerBaseUrl;
    private countryName = "ukraine";

    private requestOptions = {
        headers: new HttpHeaders({
            'AuthorizeHeader': '1569b7bd-94d2-428c-962b-858e3f46b8a2'
        }),
    };

    constructor(private http: HttpClient,
                private linkProvider: WebServerLinkProvider) {
    }

    getConfig() : Promise<Config> {
        return new Promise((resolve, reject) => {

            console.log("getting config from ", `${this.baseUrl}getconfig?countryName=${this.countryName}`);

            this.http.get(`${this.baseUrl}getconfig?countryName=${this.countryName}`, this.requestOptions)
            .subscribe(
                (data) => {
                    console.log("data received ", data);
                    resolve(data as Config);
                },
                (error) => {
                    reject(error);
                });
        });
    }

    getConfigHash(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.http.get(`${this.baseUrl}getconfighash?countryName=${this.countryName}`, this.requestOptions)
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
            this.http.get(this.baseUrl + "getFile?url=" + url, this.requestOptions).subscribe(
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
            this.http.post(this.baseUrl + "postProposedQuotes", qoute, this.requestOptions).subscribe(
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
            this.http.get(this.baseUrl + "gettimeutc", this.requestOptions).subscribe(
                (data: string) => {
                    resolve(new Date(data));
                },
                (error) => {
                    reject(error);
                }
            )
        });
    }

    async getZipFile(urls: string[]): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            if (urls.length == 0) {
                reject("nothing to download");
                return;
            }

            var oReq = new XMLHttpRequest();
            // Make sure you add the domain name to the Content-Security-Policy <meta> element.

            oReq.open("POST", `${this.linkProvider.webServerBaseUrl}getfiles`, true);
            oReq.setRequestHeader('AuthorizeHeader', '1569b7bd-94d2-428c-962b-858e3f46b8a2');
            oReq.setRequestHeader('Content-Type', 'application/json');
            // Define how you want the XHR data to come back
            oReq.responseType = "blob";
            oReq.onload = function (oEvent) {
                console.log("onload fired");
                var blob = oReq.response; // Note: not oReq.responseText
                if (blob) {

                    if (blob.size == 0) {
                        reject("blob size is 0");
                        return;
                    }

                    var reader = new FileReader();
                    //evt :ProgressEvent<FileReader>
                    reader.onloadend = (evt: any) => {
                        console.log("reader onloadend");

                        resolve(evt.target.result);
                    };

                    reader.readAsArrayBuffer(blob);
                } else {
                    console.error('we didnt get an XHR response!');
                    reject();
                }
            };
            oReq.send(JSON.stringify(urls));
        });
    }
}