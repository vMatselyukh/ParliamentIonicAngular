import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Person, ImageInfo, Config, Track } from '../models/models';

@Injectable()
export class ConfigManager {

    getConfigToDownload(dbConfig: Config, serverConfig: Config): Config {

        _.forEach(serverConfig.Persons, (webServicePerson: Person) => {
            let dbPerson = _.find(dbConfig.Persons, (dbPerson: Person) => {
                return dbPerson.Id === webServicePerson.Id;
            })

            if (dbPerson != null) {
                dbPerson = this.checkPersonImages(webServicePerson, dbPerson);
                let index: number = _.findIndex(dbConfig.Persons, (person: Person) => {
                    return person.Id === dbPerson.Id;
                });

                dbPerson = this.checkPersonTracks(webServicePerson, dbPerson);

                dbConfig.Persons[index] = dbPerson;
            }
            else {
                webServicePerson.ListButtonPicPath.MustBeDownloaded = true;
                webServicePerson.MainPicPath.MustBeDownloaded = true;
                webServicePerson.SmallButtonPicPath.MustBeDownloaded = true;

                _.forEach(webServicePerson.Tracks, (track: Track) => {
                    track.MustBeDownloaded = true;
                });

                dbConfig.Persons.push(webServicePerson);
            }
        });

        return dbConfig;
    }

    private checkPersonImages(webServicePerson: Person, dbPerson: Person): Person {

        if (dbPerson.ListButtonPicPath == null || dbPerson.ListButtonPicPath.Md5Hash !== webServicePerson.ListButtonPicPath.Md5Hash) {
            dbPerson.ListButtonPicPath = webServicePerson.ListButtonPicPath;
            dbPerson.ListButtonPicPath.MustBeDownloaded = true;
        }
        if (dbPerson.MainPicPath == null || dbPerson.MainPicPath.Md5Hash !== webServicePerson.MainPicPath.Md5Hash) {
            dbPerson.MainPicPath = webServicePerson.MainPicPath;
            dbPerson.MainPicPath.MustBeDownloaded = true;
        }
        if (dbPerson.SmallButtonPicPath == null || dbPerson.SmallButtonPicPath.Md5Hash !== webServicePerson.SmallButtonPicPath.Md5Hash) {
            dbPerson.SmallButtonPicPath = webServicePerson.SmallButtonPicPath;
            dbPerson.SmallButtonPicPath.MustBeDownloaded = true;
        }

        return dbPerson;
    }

    private checkPersonTracks(webServicePerson: Person, dbPerson: Person): Person {

        _.forEach(webServicePerson.Tracks, (webServiceTrack: Track) => {
            let dbTrack: Track = _.find(dbPerson.Tracks, (dbTrack: Track) => {
                return webServiceTrack.Id === dbTrack.Id;
            });

            if (dbTrack != null) {
                if (dbTrack.Md5Hash !== webServiceTrack.Md5Hash) {
                    let index: number = _.findIndex(dbPerson.Tracks, (track: Track) => {
                        return track.Id === webServiceTrack.Id;
                    });

                    dbTrack = webServiceTrack;
                    dbTrack.MustBeDownloaded = true;
                    dbPerson.Tracks[index] = dbTrack;
                }
            }
            else {
                webServiceTrack.MustBeDownloaded = true;
                dbPerson.Tracks.push(webServiceTrack);
            }
        });

        return dbPerson;
    }
}