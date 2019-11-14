import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Person, ImageInfo, Config, Track } from '../models/models';
import { ParliamentApi, WebServerLinkProvider } from '../providers/providers';

const IMAGES_DIR: string = "Politician_Images";
const TRACKS_DIR: string = "Politicians_Tracks";

@Injectable()
export class FileManager {
    //private baseUrl = "http://localhost:2101/Api/Parliament/";
    private baseUrl = this.linkProvider.webServerBaseUrl; //"http://11fa7543-0ee0-4-231-b9ee.azurewebsites.net/Api/Parliament/";

    //fileTransfer: FileTransferObject = this.transfer.create();

    constructor(private parliamentApi: ParliamentApi,
                private file: File,
                //private transfer: FileTransfer,
                //private platform: Platform,
                //private toast: ToastController,
                private linkProvider: WebServerLinkProvider) {
    }

    downloadFilesByConfig(config: Config): void {
        _.forEach(config.Persons, (person: Person) => {
            if (person.ListButtonPicPath.MustBeDownloaded) {

                let filePathOnServer: string = person.ListButtonPicPath.ImagePath;
                let pathElems: string[] = filePathOnServer.split('\\');
                let fileName: string = pathElems[pathElems.length - 1];

                let encodedFilePathOnServer: string = encodeURIComponent(filePathOnServer);

                let url: string = this.baseUrl + "getFile?url=" + encodedFilePathOnServer;

                // this.getImagesDirectoryOnDevice().then(directory => {
                //     this.showToast(directory);
                //     let fullFilePathOnDevice: string = directory + fileName;

                //     this.fileTransfer.download(url, fullFilePathOnDevice).then((entry) => {
                //         this.showToast('download complete: ' + entry.toURL());
                //     }, (error) => {
                //         this.showToast(error);
                //     }).catch(error => {                        
                //         this.showToast(error);
                //     });

                // }).catch(e => {
                //     this.showToast(e);
                // });
            }
        });
    }

    // getImagesDirectoryOnDevice(): Promise<string> {
    //     return new Promise((resolve, reject) => {
    //         if (this.platform.is('ios')) {
    //             this.file.checkDir(this.file.dataDirectory, IMAGES_DIR).then(() => {
    //                     resolve('ios dir already exists:' + this.file.dataDirectory + IMAGES_DIR);
    //                 })
    //                 .catch((error) => {
    //                 this.file.createDir(this.file.dataDirectory, IMAGES_DIR, false).then((directory: DirectoryEntry) => {
    //                     resolve('ios createDir:' + directory.toURL());
    //                 }).catch((error) => {
    //                     reject('ios createDirError:' + error);
    //                 });

    //                 reject("ios checkDirError:" + error);
    //             });
    //         }
    //         else if (this.platform.is('android')) {
    //             this.file.checkDir(this.file.externalDataDirectory, IMAGES_DIR)
    //                 .then(() => {
    //                     resolve('android dir already exists:' + this.file.externalDataDirectory + IMAGES_DIR);
    //                 })
    //                 .catch((error) => {
    //                 this.file.createDir(this.file.externalDataDirectory, IMAGES_DIR, false).then((directory: DirectoryEntry) => {
    //                     resolve('android createDir:' + directory.toURL());
    //                 }).catch((error) => {
    //                     reject("android createDirError " + error);
    //                 });

    //                 reject("android checkDirError:" + error);
    //             });
    //         }
    //     });
    // }

    // showToast(message: string, seconds: number = 8): void {
    //     let toast = this.toast.create({
    //         message: message,
    //         duration: seconds * 1000,
    //         position: 'bottom'
    //     });

    //     toast.present();
    // }
}