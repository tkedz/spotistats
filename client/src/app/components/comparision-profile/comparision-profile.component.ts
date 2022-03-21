import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-comparision-profile',
  templateUrl: './comparision-profile.component.html',
  styleUrls: ['./comparision-profile.component.css'],
})
export class ComparisionProfileComponent implements OnInit {
  user: User;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.authService.user.subscribe((user) => {
      this.user = user;
    });
  }

  onSaveData() {
    this.firebaseService.saveData(this.user);
  }
}
