import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/user.model';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-frontpage',
  templateUrl: './frontpage.component.html',
  styleUrls: ['./frontpage.component.css', 
  '../../../assets/bootstrap.min.css'
],
})
export class FrontpageComponent implements OnInit {
  title: string = 'Some title'

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    //const fragment = this.route.snapshot.fragment;
    console.log('frontpage init')
    const code = this.route.snapshot.queryParams['code'];
    
    if(code && !User.checkStorage()) {
      this.authService.login(code);
    }
  }
}
