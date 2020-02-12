import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Track, Person } from 'src/models/models';
import { Platform } from '@ionic/angular';
import { Howl } from 'howler';
import {
    DbContext, AlertManager, AdvProvider,
    FileManager,
    LanguageManager
} from '../../providers/providers';

@Component({
    selector: 'app-details',
    templateUrl: './details.page.html',
    styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {
    person: Person;
    player: Howl = null;
    activeTrackId = 0;

    constructor(private route: ActivatedRoute,
        private router: Router,
        private dbContext: DbContext,
        private advProvider: AdvProvider,        
        private alertManager: AlertManager,
        private fileManager: FileManager,
        public languageManager: LanguageManager,
        private platform: Platform) {
    }

    ngOnInit() {
        this.platform.ready().then(() => {
            if (this.route.snapshot.data['special']) {
                this.person = this.route.snapshot.data['special'];
            } else {
                this.router.navigateByUrl(`/home`);
            }
        });
    }

    ionViewDidLeave() {
        if (this.player) {
            this.player.stop();
        }        
    }

    ionViewDidEnter() {
        if (this.dbContext.shouldBannerBeShown) {
            this.advProvider.showBanner();
        }
    }

    getBackButtonIcon() {
        return "arrow-back";
    }

    goToHomePage() {
        console.log("go to home");
        if (this.dbContext.shouldBannerBeShown) {
            this.advProvider.hideBanner(() => {
                this.router.navigateByUrl(`/home`);
            });
        }
        else {
            this.router.navigateByUrl(`/home`);
        }
    }

    async playStopUnlockTrack(track: Track) {
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

                        //this.advProvider.loadAdv();

                        this.alertManager.showNoCoinsAlert(() => {
                            console.log("let's watch a video");

                            this.advProvider.showRewardedVideo();
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

                let src = await this.fileManager.getTrackDevicePath(track);

                this.player = new Howl({
                    src: src,
                    html5: true,
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
