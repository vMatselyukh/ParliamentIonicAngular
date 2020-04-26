﻿import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { File, DirectoryEntry, FileEntry } from '@ionic-native/file/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { Platform } from '@ionic/angular';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { WebServerLinkProvider, DbContext, ParliamentApi } from "./providers";
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { Person, Track } from '../models/models';
import { Zip } from '@ionic-native/zip/ngx';

@Injectable()
export class FileManager {
    readonly removePathBeginning = "\\resources\\";
    readonly addPathBeginning = "resources";
    readonly topFolderName = "parliament";
    readonly fileDelimiter = "\\";
    readonly tempDirectory = "temp";

    win: any = window;

    private requestOptions = {
        headers: {
            'AuthorizeHeader': '1569b7bd-94d2-428c-962b-858e3f46b8a2'
        }
    };

    constructor(private file: File,
        private platform: Platform,
        private fileTransfer: FileTransfer,
        private webServerLinkProvider: WebServerLinkProvider,
        private dbContext: DbContext,
        private webview: WebView,
        private diagnostic: Diagnostic,
        private zip: Zip,
        private parliamentApi: ParliamentApi) {
    }

    normalizeFilePath(filePath): string {
        if (filePath) {
            return filePath.toLowerCase().replace(this.removePathBeginning, '').split('\\').join('/')
        }

        return "";
    }

    deNormalizeFilePath(filePath): string {
        if (filePath) {
            return `${this.addPathBeginning}/${filePath.toLowerCase()}`;
        }

        return "";
    }

    async getMissingFiles(filesToCheck: string[]): Promise<string[]> {
        let baseDirectory = await this.getDownloadPath();

        let nonExistingFiles = [];

        let allPromises = [];

        _.forEach(filesToCheck, file => {
            let processedFileName = this.normalizeFilePath(file);
            let fileParts = processedFileName.split('/');
            let fileName = fileParts[fileParts.length - 1];
            fileParts = fileParts.slice(0, fileParts.length - 1);

            let dirPath = `${baseDirectory}/${this.topFolderName}/${fileParts.join('/')}/`;

            allPromises.push(this.file.checkFile(dirPath, fileName).catch(e => {
                nonExistingFiles.push(processedFileName);
            }));
        });

        return new Promise((resolve, reject) => {
            Promise.all(allPromises).then(files => {
                nonExistingFiles.concat(files);

                resolve(nonExistingFiles);
            });
        })
    }

    async deleteItems(filesToDelete: string[]) {
        let deleteFilesPromises = [];

        _.forEach(filesToDelete, fileToDelete => {
            deleteFilesPromises.push(this.getFile(fileToDelete).then((fileEntry: FileEntry) => {
                fileEntry.getParent((parentDirectory: DirectoryEntry) => {
                    parentDirectory.removeRecursively(
                        () => {
                            console.log("file deleted");
                        },
                        (error) => {
                            console.log("file was not deleted", error);
                        });
                },
                    (error) => {
                        console.log("file error", error);
                    });
            }));
        });

        await Promise.all(deleteFilesPromises);
    }

    async downloadFile(filePath: string): Promise<boolean> {
        // We added this check since this is only intended to work on devices and emulators 
        if (!this.platform.is('cordova')) {
            console.warn('Cannot download in local environment!');
            return;
        }

        const fileTransfer: FileTransferObject = this.fileTransfer.create();

        let uri = encodeURI(`${this.webServerLinkProvider.webServerBaseUrl}getfile?url=${filePath}`);

        let path = await this.getDownloadPath();

        return new Promise((resove, reject) => {
            fileTransfer.download(
                uri,
                `${path}/${this.topFolderName}/${filePath}`,
                true,
                this.requestOptions
            ).then(
                result => {
                    resove(true);
                    console.log("filetransfer success", result);
                },
                error => {
                    reject(false);
                    console.log("filetransfer error", error);
                }
            );
        });
    }

    async getUdatesZip(urls: string[]): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                if (urls.length == 0) {
                    resolve();
                }

                let zipFile = await this.parliamentApi.getZipFile(urls);
                let zipFileName = "updates.zip";

                let baseDirectory = await this.getDownloadPath();
                let tempLocation = `${this.topFolderName}/${this.tempDirectory}`;


                await this.saveFileToLocation(tempLocation, zipFile, zipFileName);

                this.zip.unzip(`${baseDirectory}${tempLocation}/${zipFileName}`, `${baseDirectory}${this.topFolderName}`);
                resolve();
            }
            catch (error) {
                console.log("error happened during getting updates: ", error);
                reject(error);
            }
        });
    }

    async saveFileToLocation(newLocation: string, blob: ArrayBuffer, fileName: string): Promise<any> {
        let baseDirectory = await this.getDownloadPath();

        let pathParts = newLocation.split('/');

        await this.file.checkDir(`${baseDirectory}`, newLocation)
            .then(result => { console.log("directory exists: ", result); })
            .catch(err => {
                console.log("directory error: ", err);

                console.log("creating a dir");

                let baseDir = `${baseDirectory}${pathParts.slice(0, pathParts.length - 1).join('/')}`;
                console.log("base dir: ", baseDir);

                let folderName = pathParts[pathParts.length - 1];
                console.log("folder name: ", folderName);

                this.file.createDir(baseDir, folderName, true)
                    .then(result => { console.log("directory created: ", result); })
                    .catch(err => { console.log("directory creation error: ", err); });
            });

        console.log("new file path: ", newLocation);

        return this.file.writeFile(`${baseDirectory}`, `${newLocation}/${fileName}`, blob, { replace: true });
    }

    //get path for downloads on device
    async getDownloadPath(): Promise<string> {
        if (this.platform.is('ios')) {
            return this.file.dataDirectory;
        }

        let androidSelectedStorage = await this.dbContext.getAndroidSelectedStorage();

        if (androidSelectedStorage == "local") {
            return this.file.dataDirectory;
        }
        else if (androidSelectedStorage == "external") {
            let externalSdCardPath = await this.getSdCardStoragePath();

            if (externalSdCardPath !== "") {
                await this.dbContext.setAndroidSelectedStorage('external');
                return externalSdCardPath;
            }
            else { //no external storage
                await this.dbContext.setAndroidSelectedStorage('local');
                return this.file.dataDirectory;
            }
        }

        let externalSdCardPath = await this.getSdCardStoragePath();
        if (externalSdCardPath !== "") {
            await this.dbContext.setAndroidSelectedStorage('external');
            return externalSdCardPath;
        }
        
        await this.dbContext.setAndroidSelectedStorage('local');
        return this.file.dataDirectory;
    }

    async getFile(filePath: string) {
        let processedFileName = this.normalizeFilePath(filePath);
        let baseDirectory = await this.getDownloadPath();

        return new Promise((resolve, reject) => {
            this.file.resolveDirectoryUrl(baseDirectory)
                .then((result: DirectoryEntry) => {
                    resolve(this.file.getFile(result, `${this.topFolderName}/${processedFileName}`, {}));
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    async getFileUrl(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            console.log("getting file url: ", filePath);
            this.getFile(filePath)
                .then((fileEntry: FileEntry) => {
                    resolve(fileEntry.nativeURL);
                })
                .catch(fileEntryError => {
                    console.log("error getFileUrl: ", fileEntryError, filePath);
                    resolve("");
                });
        });
    }

    async getHomeImagePath() {
        let downloadPath = await this.getDownloadPath();
        let newFilePath = `/test/image.jpg`;

        let path = await this.getFileUrl(newFilePath);

        if (this.platform.is('ios')) {
            path = this.win.Ionic.WebView.convertFileSrc(path);
        }
        else {
            path = this.webview.convertFileSrc(path);
        }

        return path;
    }

    async getListButtonImagePath(person: Person): Promise<string> {
        let path = await this.getFileUrl(person.ListButtonPicPath.ImagePath);

        if (this.platform.is('ios')) {
            path = this.win.Ionic.WebView.convertFileSrc(path);
        }
        else{
            path = this.webview.convertFileSrc(path);
        }
        
        return path;
    }

    async getSmallButtonImagePath(person: Person): Promise<string> {
        let path = await this.getFileUrl(person.SmallButtonPicPath.ImagePath);
        
        if (this.platform.is('ios')) {
            path = this.win.Ionic.WebView.convertFileSrc(path);
        }
        else{
            path = this.webview.convertFileSrc(path);
        }

        return path;
    }

    async getMainPicImagePath(person: Person): Promise<string> {
        let path = await this.getFileUrl(person.MainPicPath.ImagePath);
        
        if (this.platform.is('ios')) {
            path = this.win.Ionic.WebView.convertFileSrc(path);
        }
        else{
            path = this.webview.convertFileSrc(path);
        }

        return path;
    }

    async getTrackDevicePath(track: Track): Promise<string> {
        let path = await this.getFileUrl(track.Path);
        path = this.webview.convertFileSrc(path);
        return path;
    }

    async getSdCardStoragePath(): Promise<string> {
        let externalStoragePath = "";

        await this.getStorageWritePermission().then(async status => {
            if (status === this.diagnostic.permissionStatus.GRANTED) {
                await this.diagnostic.getExternalSdCardDetails().then(details => {
                    details.forEach(function (detail) {
                        //157286400 = 100Mb
                        if (detail.canWrite && detail.freeSpace > 157286400 && externalStoragePath === "") {
                            console.log("diagnostic external file path", detail.filePath);
                            externalStoragePath = detail.filePath;
                        }
                    });
                }, error => {
                    console.error("diagnostic external file path", error);
                });
            }
        });

        return externalStoragePath;
    }

    async getStorageWritePermission(): Promise<any> {
        return this.diagnostic.requestExternalStorageAuthorization();
    }
}