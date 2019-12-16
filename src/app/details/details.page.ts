import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Track, Person } from 'src/models/models';
import { Howl } from 'howler';
import { DbContext, AlertManager, AdvProvider } from '../../providers/providers';

@Component({
    selector: 'app-details',
    templateUrl: './details.page.html',
    styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {
    person: Person;
    player: Howl = null;
    activeTrackId = 0;

    constructor(private route: ActivatedRoute, private router: Router,
        private dbContext: DbContext,
        private advProvider: AdvProvider,        
        private alertManager: AlertManager) {
    }

    ngOnInit() {
        if (this.route.snapshot.data['special']) {
            this.person = this.route.snapshot.data['special'];
        }
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

                        this.advProvider.loadAdv();

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
