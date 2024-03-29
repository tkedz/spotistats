import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
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
  error: string;

  constructor(
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private spotifyService: SpotifyService
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    this.userSub = this.authService.user.pipe(take(1)).subscribe((user) => {
      this.user = user;
      this.comparedUserName = this.activatedRoute.snapshot.paramMap.get('id');

      this.spotifyService.compare(this.user, this.comparedUserName)
        .subscribe((res) => {
          console.log(res);
          this.compareData = res;
          this.displayData = this.compareData.short;
        }, (err) => {
          this.error = 'Podany użytkownik nie korzysta z aplikacji'
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
