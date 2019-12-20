import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Person, ImageInfo, Config, Track } from '../models/models';
import { File, DirectoryEntry } from '@ionic-native/file/ngx';

const IMAGES_DIR: string = "Politician_Images";
const TRACKS_DIR: string = "Politicians_Tracks";

@Injectable()
export class FileManager {
    readonly removePathBeginning = "\\resources\\";
    readonly topFolderName = "parliament";
    readonly fileDelimiter = "\\";
    //fileTransfer: FileTransferObject = this.transfer.create();

    constructor(private file: File) {
    }

    getFilesToBeDownloaded(filesToCheck: string[]): Promise<string[]> {
        let nonExistingFiles = [];

        let allPromises = [];

        _.forEach(filesToCheck, file => {
            let processedFileName = file.toLowerCase().replace(this.removePathBeginning, '').split('\\').join('/');

            allPromises.push(this.file.checkFile(this.file.dataDirectory, processedFileName).catch(e => {
                nonExistingFiles.push(processedFileName);
            }));
        });

        //this.file.checkDir(this.file.dataDirectory, this.topFolderName)
        //    .then(dir => {


        //        console.log(`Directory ${this.topFolderName} exists`);

        //        this.file.checkDir(this.file.dataDirectory, this.topFolderName)
        //    })
        //    .catch(err => {
        //        console.log("Directory doesn't exist", err);
        //        this.file.createDir(this.file.dataDirectory, this.topFolderName, false).then(_ => {
        //            return filesToCheck;
        //            console.log("folder created");
        //        }).catch(e => {
        //            return [];
        //            console.log("error while creating dir", e);
        //        });
        //    });

        return new Promise((resolve, reject) => {
            Promise.all(allPromises).then(files => {
                nonExistingFiles.concat(files);

                resolve(nonExistingFiles);
            });
        })
    }

    //checkIfFileExists(filePath) {
    //    let pathParts = filePath.split(this.fileDelimiter);
    //    if (pathParts.length == 1) {
    //        this.file.checkFile(this.file.dataDirectory, pathParts[0]).then(result => {
    //            console.log('result', result);
    //        }).catch(e => { console.log('error', e);});
    //    }

    //    this.file.resolveLocalFilesystemUrl(this.file.dataDirectory).then((dirEntry: DirectoryEntry) => {
    //        for (let i = 0; i < pathParts.length - 1; i++) {
    //            this.getDirEntry(dirEntry, pathParts[i], (nextDir: DirectoryEntry) => {
    //                if (nextDir) {

    //                }
    //            });
    //        }
    //        //dirEntry.get
    //        //this.file.checkDir(dirEntry, pathParts[0]).then(result => {
    //        //    if (result) {
    //        //        this.file.getDirectory(this.file.dataDirectory, pathParts[i], () => { })
    //        //    }
    //    });
    //}

    getDirEntry(dirEntry: DirectoryEntry, dirName: string, successCallback) {
        dirEntry.getDirectory(dirName, null, successCallback);
    }

    downloadFilesByConfig(config: Config): void {
        _.forEach(config.Persons, (person: Person) => {
            if (person.ListButtonPicPath.MustBeDownloaded) {

                let filePathOnServer: string = person.ListButtonPicPath.ImagePath;
                let pathElems: string[] = filePathOnServer.split('\\');
                let fileName: string = pathElems[pathElems.length - 1];

                let encodedFilePathOnServer: string = encodeURIComponent(filePathOnServer);

                //let url: string = this.baseUrl + "getFile?url=" + encodedFilePathOnServer;

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