import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, take } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/models/user.model';
import { AlbumResponse, SpotifyService, TrackResponse } from 'src/app/services/spotify.service';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css']
})
export class RecommendationsComponent implements OnInit, OnDestroy {
  user: User = null;
  userSub: Subscription;
  searchValue: string = '';
  albums: Array<AlbumResponse> = [];
  tracks: Array<TrackResponse> = [];
  selected: Array<any> = [];
  
  constructor(private authService: AuthService, private spotifyService: SpotifyService) { }

  ngOnInit(): void {
    this.userSub = this.authService.user.pipe(take(1)).subscribe((user) => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }

  onSearch(): void {
    this.spotifyService.search(this.user, this.searchValue).subscribe(
      (res) => {
        this.albums = res.albums
        this.tracks = res.tracks
        console.log(this.albums, this.tracks);
      },
      (err) => {
        console.log(err);
      }
    );
  }

  addToPool(index: number, type: string): void {
    const data = type === 'album' ? this.albums[index] : this.tracks[index]
    this.selected.push({type, data})
    console.log(this.selected);
  }

}
