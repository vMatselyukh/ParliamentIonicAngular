import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Track, Person } from 'src/models/models';
import { Howl } from 'howler';
import { DbContext } from '../../providers/db-context';
import { AdMobFree, AdMobFreeRewardVideoConfig } from "@ionic-native/admob-free/ngx";
import { Platform } from '@ionic/angular';

@Component({
    selector: 'app-details',
    templateUrl: './details.page.html',
    styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {

    rewardedAndroid: string = "ca-app-pub-3291616985383560/7058759376";
    rewardedIos: string = "ca-app-pub-3291616985383560/9452138367";


    person: Person;
    player: Howl = null;
    activeTrackId = 0;

    constructor(private route: ActivatedRoute, private router: Router,
        private dbContext: DbContext,
        private admob: AdMobFree,
        private platform: Platform) {
    }

    ngOnInit() {
        if (this.route.snapshot.data['special']) {
            this.person = this.route.snapshot.data['special'];
        }

        this.platform.ready().then(() => {
            if (this.platform.is('cordova')) {

                console.log("init add");
                this.admob.rewardVideo.config({
                    id: 'ca-app-pub-3291616985383560/7058759376',
                    isTesting: false,
                    autoShow: false
                });

                this.admob.rewardVideo.prepare().then(() => {
                    console.log("prepared");
                });

                document.addEventListener('admob.reward_video.complete', () => {
                    console.log("add more coins here");
                });

                document.addEventListener('admob.reward_video.events.LOAD', function (data) { console.log('admob.reward_video.events.LOAD', data); });
                document.addEventListener('admob.reward_video.events.LOAD_FAIL', function (data) { console.log('admob.reward_video.events.LOAD_FAIL', data); });
                document.addEventListener('admob.reward_video.events.OPEN', function (data) { console.log('admob.banner.reward_video.OPEN', data); });
                document.addEventListener('admob.reward_video.events.CLOSE', function (data) { console.log('admob.reward_video.events.CLOSE', data); });
            }
        });
    }

    ionViewDidLeave() {
        if (this.player) {
            this.player.stop();
        }
    }

    playStopUnlockTrack(track: Track) {
        if (this.player) {
            this.player.stop();
        }

        if (this.activeTrackId == track.Id) {
            this.activeTrackId = 0;
        }
        else {
            if (track.IsLocked) {
                this.dbContext.getCoinsCount().then(count => {
                    if (count == 0) {

                        this.admob.rewardVideo.isReady().then(() => {
                            this.admob.rewardVideo.show().then(() => {
                                console.log("add should be shown");
                            }).catch(error => {
                                console.log("add show error happened " + JSON.stringify(error));
                            });
                        }).catch((error) => {
                            console.log("ready error " + JSON.stringify(error));
                        });
                    }
                    else {
                        this.dbContext.unlockTrack(this.person.Id, track.Id).then(() => {
                            for (let i = 0; i < this.person.Tracks.length; i++) {
                                if (this.person.Tracks[i].Id == track.Id) {
                                    track.IsLocked = false;
                                }
                            }
                        });
                        this.dbContext.saveCoins(count - 1);
                    }
                })
            }
            else {
                this.activeTrackId = track.Id;

                let self = this;

                this.player = new Howl({
                    src: "/assets/tracks/klichko/zavtrashniyDen.ogg",
                    onend: function () {
                        self.activeTrackId = 0;
                    }
                });

                this.player.play();
            }
        }
    }

    getTrackIcon(track: Track): string {
        if (track.Id == this.activeTrackId) {
            return "pause";
        }
        else if (track.IsLocked) {
            return "lock";
        }
        else {
            return "play";
        }
    }
}
