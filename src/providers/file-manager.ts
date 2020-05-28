import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { File, DirectoryEntry, FileEntry } from '@ionic-native/file/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { Platform } from '@ionic/angular';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import {
    WebServerLinkProvider, DbContext,
    ParliamentApi, LoggingProvider
} from "./providers";
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
    readonly chunkSizeInBytes = 0.5 * 1024 * 1024;

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
        private parliamentApi: ParliamentApi,
        private logger: LoggingProvider) {
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

            let dirPath = `${baseDirectory}${this.topFolderName}/${fileParts.join('/')}/`;

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
                    parentDirectory.getMetadata((metadata) => {
                        this.logger.log("folder metadata: ", metadata);
                    });

                    fileEntry.remove(
                        () => {
                            console.log("file deleted");
                        },
                        (error) => {
                            console.log("file was not deleted", error);
                        });
                    //parentDirectory.removeRecursively(
                    //    () => {
                    //        console.log("file deleted");
                    //    },
                    //    (error) => {
                    //        console.log("file was not deleted", error);
                    //    });
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

    async getUdatesZip(urls: string[], progressCallback = null, zipDownloadedCallback = null): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let zipFileName = "updates.zip";

            let baseDirectory = await this.getDownloadPath();
            let tempLocation = `${this.topFolderName}/${this.tempDirectory}`;

            try {
                if (urls.length == 0) {
                    resolve();
                }

                let zipFile = await this.parliamentApi.getZipFile(urls, progressCallback);

                zipDownloadedCallback();

                console.log("zip ready to be saved");

                await this.saveFileToLocation(tempLocation, zipFile, zipFileName);

                console.log("zip saved");

                await this.zip.unzip(`${baseDirectory}${tempLocation}/${zipFileName}`, `${baseDirectory}${this.topFolderName}`)
                    .then(async (count) => {
                        if (count == 0) {
                            console.log("unzipped successfully");
                        }
                        else {
                            console.log("unzipped error happened");
                        }

                        await this.deleteZip(`${baseDirectory}${tempLocation}`, zipFileName);
                    })
                    .catch((error) => {
                        console.log("unzipping error: ", error);
                    });

                resolve();
            }
            catch (error) {
                console.log("error happened during getting updates: ", error);

                await this.deleteZip(`${baseDirectory}${tempLocation}`, zipFileName);

                reject(error);
            }
        });
    }

    async deleteZip(dirPath: string, zipFileName: string) {
        if (!zipFileName) {
            console.log("can't delete an empty file name");
            return;
        }

        console.log("deleting zip file");
        await this.file.removeFile(dirPath, zipFileName).then(_ => {
            console.log("zip deleted");
        })
        .catch(error => {
            console.log("error happened during deleting zip file: ", error);
        });
    }

    async saveFileToLocation(newLocation: string, blob: ArrayBuffer, fileName: string): Promise<any> {
        let baseDirectory = await this.getDownloadPath();

        let pathParts = newLocation.split('/');

        for (let i = 0; i < pathParts.length; i++) {
            await this.file.checkDir(`${baseDirectory}`, pathParts.slice(0, i + 1).join('/'))
                .then(result => { console.log("directory exists: ", result); })
                .catch(async err => {
                    console.log("directory error: ", err);

                    console.log("creating a dir");

                    let ending = i === 0 ? "" : "/";

                    let baseDir = `${baseDirectory}${pathParts.slice(0, i).join('/')}${ending}`;
                    console.log("base dir: ", baseDir);

                    let folderName = pathParts[i];
                    console.log("folder name: ", folderName);

                    await this.file.createDir(baseDir, folderName, true)
                        .then(result => { console.log("directory created: ", result); })
                        .catch(err => { console.log("directory creation error: ", err); });
                });
        }

        return new Promise(async (resolve, reject) => {

            let isError = false;

            let totalBytes = blob.byteLength;
            console.log("total bytes: ", totalBytes);

            let chunksCount = blob.byteLength / this.chunkSizeInBytes;
            console.log("chunks count: ", chunksCount);

            await this.file.createFile(`${baseDirectory}`, `${newLocation}/${fileName}`, true)
                .then(() => {
                    console.log("file created: ", fileName);
                })
                .catch((error) => {
                    console.log("file creation error: ", error);
                });

            if (chunksCount > 0) {
                chunksCount++;

                for (let i = 0; i < chunksCount; i++) {
                    await this.file.writeFile(`${baseDirectory}`, `${newLocation}/${fileName}`,
                        blob.slice(i * this.chunkSizeInBytes, (i + 1) * this.chunkSizeInBytes), { append: true })
                        .then((value) => { 
                            console.log(`file chunk saved to directory. start ${i * this.chunkSizeInBytes}, end ${(i + 1) * this.chunkSizeInBytes}`, value); 
                        })
                        .catch((error) => {
                            console.log(`error writing chunk. start ${i * this.chunkSizeInBytes}, end ${(i + 1) * this.chunkSizeInBytes}`, JSON.stringify(error));
                            isError = true;
                        });
                }
            }
            else {
                await this.file.writeFile(`${baseDirectory}`, `${newLocation}/${fileName}`, blob)
                    .then((value) => 
                    { 
                        console.log("file saved to directory: ", value); 
                    })
                    .catch((error) => {
                        console.log("error writing file: ", error);
                        isError = true;
                    });
            }

            if(isError)
            {
                reject();
            }
            else
            {
                resolve();
            }
        });
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

        this.logger.log("base directory: ", baseDirectory);

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
            this.logger.log("getting file url: ", filePath);
            this.getFile(filePath)
                .then((fileEntry: FileEntry) => {
                    resolve(fileEntry.nativeURL);
                })
                .catch(fileEntryError => {
                    this.logger.log("error getFileUrl: ", fileEntryError, filePath);
                    reject("error getFileUrl");
                });
        });
    }

    async getListButtonImagePath(person: Person): Promise<string> {
        let path = await this.getFileUrl(person.ListButtonPicPath.ImagePath);

        if (this.platform.is('ios')) {
            path = this.win.Ionic.WebView.convertFileSrc(path);
        }
        else {
            path = this.webview.convertFileSrc(path);
        }

        return path;
    }

    async getSmallButtonImagePath(person: Person): Promise<string> {
        let path = await this.getFileUrl(person.SmallButtonPicPath.ImagePath);

        if (this.platform.is('ios')) {
            path = this.win.Ionic.WebView.convertFileSrc(path);
        }
        else {
            path = this.webview.convertFileSrc(path);
        }

        return path;
    }

    async getMainPicImagePath(person: Person): Promise<string> {
        let path = await this.getFileUrl(person.MainPicPath.ImagePath);

        if (this.platform.is('ios')) {
            path = this.win.Ionic.WebView.convertFileSrc(path);
        }
        else {
            path = this.webview.convertFileSrc(path);
        }

        return path;
    }

    async getTrackDevicePath(track: Track): Promise<string> {
        //let defaultConfigIsUsed = await this.dbContext.getDefaultConfigIsUsed();

        let path = "";

        if (track.Path.indexOf("assets/tracks/") > -1) {
            this.logger.log('get track device path. using path from assets');

            path = track.Path;
        }
        else {
            path = await this.getFileUrl(track.Path);
        }
        path = this.webview.convertFileSrc(path);
        return path;
    }

    async getSdCardStoragePath(): Promise<string> {
        let externalStoragePath = "";

        let self = this;

        await this.getStorageWritePermission().then(async status => {
            if (status === this.diagnostic.permissionStatus.GRANTED) {
                await this.diagnostic.getExternalSdCardDetails().then(details => {
                    details.forEach(function (detail) {
                        //157286400 = 100Mb
                        if (detail.canWrite && externalStoragePath === "" && detail.type === "application") {
                            self.logger.log("diagnostic external file path: ", detail.filePath);

                            if (detail.freeSpace < 157286400) {
                                throw new Error("not enough free space");
                            }

                            externalStoragePath = detail.filePath + "/";
                        }
                    });
                }, error => {
                    self.logger.log("diagnostic external file path error: ", error);
                });
            }
        });

        return externalStoragePath;
    }

    async getStorageWritePermission(): Promise<any> {
        return this.diagnostic.requestExternalStorageAuthorization();
    }
}