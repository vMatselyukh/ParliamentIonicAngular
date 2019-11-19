import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { DbContext, ParliamentApi, ConfigManager, FileManager, WebServerLinkProvider } from '../providers/providers';
import { HttpClientModule } from '@angular/common/http';

import { ReactiveFormsModule } from '@angular/forms';

import { ProposeQuotePageModule } from './propose-quote/propose-quote.module';
import { ProposeQuotePage } from './propose-quote/propose-quote.page';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [ProposeQuotePage],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule,
    ReactiveFormsModule, ProposeQuotePageModule],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    DbContext,
    ParliamentApi,
    ConfigManager,
    WebServerLinkProvider
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
