import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import React from 'react';
import ReactDOM from 'react-dom'
import ReactApp from "./components/App"

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild("reactTarget", { static: true }) public reactTarget: ElementRef;

  public title = 'angular-react-wallaby';

  constructor(
      protected zone: NgZone,
  ) {
  }

  public ngOnInit() {
    this.renderReactApp();
  }

  public ngOnDestroy() {
      ReactDOM.unmountComponentAtNode(this.reactTarget.nativeElement);
  }

  protected renderReactApp(): void {
      this.zone.runOutsideAngular(() => {
          ReactDOM.render(React.createElement(ReactApp, {title: this.title}), this.reactTarget.nativeElement);
      });
  }
}
