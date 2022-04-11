import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/models/user.model';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from 'src/app/services/storage.service';
import { SpotifyService } from 'src/app/services/spotify.service';

@Component({
  selector: 'app-compare',
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.css'],
})
export class CompareComponent implements OnInit {
  user: User;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private spotifyService: SpotifyService
  ) {}

  ngOnInit(): void {
    this.authService.user.subscribe((user) => {
      this.user = user;

    });
    this.spotifyService.compare(this.user, this.route.snapshot.paramMap.get('id'))
      .subscribe((res) => {
        console.log(res);
      });
  }
}
