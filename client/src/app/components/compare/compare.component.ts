import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/models/user.model';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from 'src/app/services/storage.service';
import { CompareResponse, SpotifyService } from 'src/app/services/spotify.service';
import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-compare',
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.css'],
})
export class CompareComponent implements OnInit, OnDestroy {
  @ViewChild('shortTermBtn') shortTermBtn: ElementRef;
  @ViewChild('mediumTermBtn') mediumTermBtn: ElementRef; 
  @ViewChild('longTermBtn') longTermBtn: ElementRef; 
  user: User;
  userSub: Subscription;
  comparedUserName: string
  compareData: CompareResponse;
  displayData: any;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private spotifyService: SpotifyService
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.user.pipe(take(1)).subscribe((user) => {
      this.user = user;
      this.comparedUserName = this.route.snapshot.paramMap.get('id');

      this.spotifyService.compare(this.user, this.comparedUserName)
        .subscribe((res) => {
          console.log(res);
          this.compareData = res;
          this.displayData = this.compareData.short;
        }, (err) => {
          
        });
    });
  }

  show(term: string): void {
    switch (term) {
      case 'short':
        this.shortTermBtn.nativeElement.classList.add('is-active');
        this.mediumTermBtn.nativeElement.classList.remove('is-active');
        this.longTermBtn.nativeElement.classList.remove('is-active');
        this.displayData = this.compareData.short;
        break;
      case 'medium':
        this.shortTermBtn.nativeElement.classList.remove('is-active');
        this.mediumTermBtn.nativeElement.classList.add('is-active');
        this.longTermBtn.nativeElement.classList.remove('is-active');
        this.displayData = this.compareData.medium;
        break;
      case 'long':
        this.shortTermBtn.nativeElement.classList.remove('is-active');
        this.mediumTermBtn.nativeElement.classList.remove('is-active');
        this.longTermBtn.nativeElement.classList.add('is-active');
        this.displayData = this.compareData.long;
        break;
      default:
        break;
    }
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }
}
