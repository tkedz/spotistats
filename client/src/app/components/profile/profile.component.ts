import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  public user: User = null;
  isActiveRecentlyPlayedComponent = true;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.user.subscribe((loggedUser) => (this.user = loggedUser));

    console.log(this.user);
  }
}
