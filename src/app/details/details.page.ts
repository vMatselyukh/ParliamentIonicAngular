import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Track } from 'src/models/track';
import { Howl } from 'howler';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {

  data: any;
  player: Howl = null;
  activeTrackId = 0;

  constructor(private route: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    if (this.route.snapshot.data['special']) {
      this.data = this.route.snapshot.data['special'];
    }
  }

  ionViewDidLeave(){
    this.player.stop();
  }

  getTrackIcon(track: Track) {
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

  playStopUnlockTrack(track: Track) {
    if(this.player){
      this.player.stop();
    }

    if (this.activeTrackId == track.Id) {
      this.activeTrackId = 0;
    }
    else {
      this.activeTrackId = track.Id;

      this.player = new Howl({
        src: "/assets/tracks/klichko/zavtrashniyDen.ogg",
        onend: function() {
          this.activeTrackId = 0;
        }
      });

      this.player.play();
    }
  }
}
