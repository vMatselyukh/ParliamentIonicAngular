import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Person, Config, Track } from '../models/models';

@Injectable()
export class ConfigManager {

    getResourcesToDownload(dbConfig: Config, serverConfig: Config): string[] {

        let imagesToDownload = this.getImagesToDownload(dbConfig, serverConfig);
        let tracksToDownload = this.getTracksToDownload(dbConfig, serverConfig);

        return imagesToDownload.concat(tracksToDownload);
    }

    getResourcesToDelete(dbConfig: Config, serverConfig: Config): string[] {

        let imagesToDelete = this.getImagesToDelete(dbConfig, serverConfig);
        let tracksToDelete = this.getTracksToDelete(dbConfig, serverConfig);

        return imagesToDelete.concat(tracksToDelete);
    }

    getAllResources(dbConfig: Config): string[] {
        let resources = [];

        _.forEach(dbConfig.Persons, (dbPerson: Person) => {
            if (dbPerson.ListButtonPicPath.ImagePath) {
                resources.push(dbPerson.ListButtonPicPath.ImagePath);
            }

            if (dbPerson.SmallButtonPicPath.ImagePath) {
                resources.push(dbPerson.SmallButtonPicPath.ImagePath);
            }

            if (dbPerson.MainPicPath.ImagePath) {
                resources.push(dbPerson.MainPicPath.ImagePath);
            }

            resources = resources.concat(_.filter(dbPerson.Tracks, track => {
                return track.Path;
            }).map(track => {
                return track.Path;
            }));
        });

        return resources;
    }

    copyConfig(localConfig: Config, serverConfig: Config) {
        this.copyUnlockedTracks(localConfig, serverConfig);
    }

    private copyUnlockedTracks(localConfig: Config, serverConfig: Config) {
        _.forEach(localConfig.Persons, localPerson => {
            let serverPerson = serverConfig.Persons.find(serverPerson => {
                if (serverPerson.Id == localPerson.Id) {
                    return true;
                }

                return false;
            });

            if (serverPerson == null) {
                return;
            }

            let serverPersonIndex = serverConfig.Persons.indexOf(serverPerson);

            _.forEach(localPerson.Tracks, localTrack => {
                if (!localTrack.IsLocked) {
                    let serverTrack = serverConfig.Persons[serverPersonIndex].Tracks.find(serverTrack => {
                        if (serverTrack.Id == localTrack.Id) {
                            return true;
                        }

                        return false;
                    });

                    if (serverTrack == null) {
                        return;
                    }

                    let serverTrackIndex = serverConfig.Persons[serverPersonIndex].Tracks.indexOf(serverTrack);
                    serverConfig.Persons[serverPersonIndex].Tracks[serverTrackIndex].IsLocked = false;
                }
            });
        });
    }

    private getImagesToDelete(dbConfig: Config, serverConfig: Config): string[] {
        let imagesList = [];

        //go through each person of db config
        _.forEach(dbConfig.Persons, (dbPerson: Person) => {
            //find appropriate person in server config
            let serverPerson = _.find(serverConfig.Persons, (personFromServer: Person) => {
                return personFromServer.Id === dbPerson.Id;
            })

            if (serverPerson == null) {
                imagesList.push(dbPerson.ListButtonPicPath.ImagePath);
                imagesList.push(dbPerson.MainPicPath.ImagePath);
                imagesList.push(dbPerson.SmallButtonPicPath.ImagePath);
            }
        });

        return imagesList;
    }

    private getImagesToDownload(dbConfig: Config, serverConfig: Config): string[] {
        let imagesList = [];

        //go through each person of server config
        _.forEach(serverConfig.Persons, (webServicePerson: Person) => {
            //find appropriate person in local config
            let dbPerson = _.find(dbConfig.Persons, (dbPerson: Person) => {
                return dbPerson.Id === webServicePerson.Id;
            })

            if (dbPerson != null) {
                imagesList = imagesList.concat(this.getPersonImagesToUpdate(webServicePerson, dbPerson));
            }
            else {
                imagesList.push(webServicePerson.ListButtonPicPath.ImagePath);
                imagesList.push(webServicePerson.MainPicPath.ImagePath);
                imagesList.push(webServicePerson.SmallButtonPicPath.ImagePath);
            }
        });

        return imagesList;
    }

    private getTracksToDelete(dbConfig: Config, serverConfig: Config): string[] {

        let tracksList = [];

        //go through each person of server config
        _.forEach(dbConfig.Persons, (dbConfigPerson: Person) => {
            //find appropriate person in local config
            let serverConfigPerson = _.find(serverConfig.Persons, (serverPerson: Person) => {
                return dbConfigPerson.Id === serverPerson.Id;
            })

            if (serverConfigPerson != null) {

                _.forEach(dbConfigPerson.Tracks, (dbTrack) => {
                    let serverTrack = _.find(serverConfigPerson.Tracks, (serverPersonTrack) => {
                        return serverPersonTrack.Id === dbTrack.Id;
                    });

                    if (serverTrack == null) {
                        tracksList.push(dbTrack.Path);
                    }
                })
            }
            else {
                tracksList = tracksList.concat(dbConfigPerson.Tracks.map(track => {
                    return track.Path;
                }));
            }
        });

        return tracksList;
    }

    private getTracksToDownload(dbConfig: Config, serverConfig: Config): string[] {

        let tracksList = [];

        //go through each person of server config
        _.forEach(serverConfig.Persons, (webServicePerson: Person) => {
            //find appropriate person in local config
            let dbPerson = _.find(dbConfig.Persons, (dbPerson: Person) => {
                return dbPerson.Id === webServicePerson.Id;
            })

            if (dbPerson != null) {
                tracksList = tracksList.concat(this.getPersonTracksToUpdate(webServicePerson, dbPerson));
            }
            else {
                tracksList = tracksList.concat(webServicePerson.Tracks.map(track => {
                    return track.Path;
                }));
            }
        });

        return tracksList;
    }

    private getPersonImagesToUpdate(webServicePerson: Person, dbPerson: Person): string[] {

        let imagesToUpdate = [];

        if (dbPerson.ListButtonPicPath == null || dbPerson.ListButtonPicPath.Md5Hash !== webServicePerson.ListButtonPicPath.Md5Hash) {
            imagesToUpdate.push(webServicePerson.ListButtonPicPath.ImagePath);
        }
        if (dbPerson.MainPicPath == null || dbPerson.MainPicPath.Md5Hash !== webServicePerson.MainPicPath.Md5Hash) {
            imagesToUpdate.push(webServicePerson.MainPicPath.ImagePath);
        }
        if (dbPerson.SmallButtonPicPath == null || dbPerson.SmallButtonPicPath.Md5Hash !== webServicePerson.SmallButtonPicPath.Md5Hash) {
            imagesToUpdate.push(webServicePerson.SmallButtonPicPath.ImagePath);
        }

        return imagesToUpdate;
    }

    private getPersonTracksToUpdate(webServicePerson: Person, dbPerson: Person): string[] {
        let tracksToUpdate = [];

        //loop through each webserver track
        _.forEach(webServicePerson.Tracks, (webServiceTrack: Track) => {
            //get appropriate track from db
            let dbTrack: Track = _.find(dbPerson.Tracks, (dbTrack: Track) => {
                return webServiceTrack.Id === dbTrack.Id;
            });

            if (dbTrack != null) {
                if (dbTrack.Md5Hash !== webServiceTrack.Md5Hash) {
                    tracksToUpdate.push(dbTrack.Path);
                }
            }
            else {
                tracksToUpdate.push(webServiceTrack.Path);
            }
        });

        return tracksToUpdate;
    }
}