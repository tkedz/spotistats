import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit, OnDestroy {
  isLogged: boolean;
  private userSub: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userSub = this.authService.user.subscribe((user) => {
      this.isLogged = user ? true : false;
      console.log(this.isLogged);
    });

    if (!this.isLogged) {
      setTimeout(() => {
        this.authService.loginRedirect();
      }, 3000);
    }
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }
}
