import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import {
  ArtistResponse,
  TrackResponse,
} from 'src/app/services/spotify.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
})
export class CardComponent implements OnInit, AfterViewInit {
  @Input() artist: ArtistResponse;
  @Input() track: TrackResponse;
  @Input() id: string;
  @ViewChild('cardNameDiv') cardNameDiv: ElementRef;
  @ViewChild('cardNameBorder') cardNameBorder: ElementRef;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    const border = this.cardNameDiv.nativeElement.offsetHeight + 7 + 'px';
    this.cardNameBorder.nativeElement.style.minHeight = border;

  }
}
