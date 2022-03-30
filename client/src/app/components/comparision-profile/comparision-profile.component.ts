import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/models/user.model';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-comparision-profile',
  templateUrl: './comparision-profile.component.html',
  styleUrls: ['./comparision-profile.component.css'],
})
export class ComparisionProfileComponent implements OnInit {
  user: User;

  constructor(
    private authService: AuthService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.authService.user.subscribe((user) => {
      this.user = user;
    });
  }

  onSaveData() {
    this.storageService.saveData(this.user);
  }
}
