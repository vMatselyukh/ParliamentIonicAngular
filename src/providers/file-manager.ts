import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Person, ImageInfo, Config, Track } from '../models/models';
import { File, DirectoryEntry } from '@ionic-native/file/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { Platform } from '@ionic/angular';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { WebServerLinkProvider, DbContext } from "./providers";

const IMAGES_DIR: string = "Politician_Images";
const TRACKS_DIR: string = "Politicians_Tracks";

@Injectable()
export class FileManager {
    readonly removePathBeginning = "\\resources\\";
    readonly addPathBeginning = "resources";
    readonly topFolderName = "parliament";
    readonly fileDelimiter = "\\";
    //fileTransfer: FileTransferObject = this.transfer.create();

    constructor(private file: File,
        private platform: Platform,
        private fileTransfer: FileTransfer,
        private webServerLinkProvider: WebServerLinkProvider,
        private androidPermissions: AndroidPermissions,
        private dbContext: DbContext) {
    }

    normalizeFilePath(filePath): string {
        return filePath.toLowerCase().replace(this.removePathBeginning, '').split('\\').join('/')
    }

    deNormalizeFilePath(filePath): string {
        return `${this.addPathBeginning}/${filePath.toLowerCase()}`;
    }

    async getFilesToBeDownloaded(filesToCheck: string[]): Promise<string[]> {
        let baseDirectory = this.file.dataDirectory;

        let directoryName = await this.dbContext.getAndroidSelectedStorage();

        if (this.platform.is('android') && directoryName == 'external') {
            baseDirectory = this.file.externalRootDirectory;
        }

        let nonExistingFiles = [];

        let allPromises = [];

        _.forEach(filesToCheck, file => {
            let processedFileName = this.normalizeFilePath(file);

            allPromises.push(this.file.checkFile(baseDirectory, `${this.topFolderName}/${processedFileName}`).catch(e => {
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

    async downloadFile(filePath: string) {
        // We added this check since this is only intended to work on devices and emulators 
        if (!this.platform.is('cordova')) {
            console.warn('Cannot download in local environment!');
            return;
        }

        const fileTransfer: FileTransferObject = this.fileTransfer.create();

        let uri = encodeURI(`${this.webServerLinkProvider.webServerBaseUrl}getfile?url=${filePath}`);

        let path = await this.getDownloadPath();

        return fileTransfer.download(
            uri,
            `${path}/${this.topFolderName}/${filePath}`
        ).then(
            result => {
                console.log("filetransfer success", result);
            },
            error => {
                console.log("filetransfer error", error);
            }
        );
    }

    async getDownloadPath(): Promise<string> {
        if (this.platform.is('ios')) {
            return this.file.dataDirectory;
        }

        let androidSelectedStorage = await this.dbContext.getAndroidSelectedStorage();

        if (androidSelectedStorage == "local") {
            return this.file.dataDirectory;
        }
        else if (androidSelectedStorage == "external") {
            return this.file.externalRootDirectory;
        }

        // To be able to save files on Android, we first need to ask the user for permission. 
        // We do not let the download proceed until they grant access
        let permissionResponse = await this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE).then(
            result => {
                if (!result.hasPermission) {
                    return this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE);
                }
            }
        );

        if (permissionResponse.hasPermission) {
            await this.dbContext.setAndroidSelectedStorage('external');
            return this.file.externalRootDirectory;
        }


        await this.dbContext.setAndroidSelectedStorage('local');
        return this.file.dataDirectory;
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