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
import { SocialPopoverComponent } from './social-popover/social-popover.component';

import { SocialSharing } from '@ionic-native/social-sharing/ngx';

@NgModule({
    declarations: [AppComponent, SocialPopoverComponent],
    entryComponents: [ProposeQuotePage, SocialPopoverComponent],
    imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule,
        ReactiveFormsModule, ProposeQuotePageModule],
    providers: [
        StatusBar,
        SplashScreen,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        DbContext,
        ParliamentApi,
        ConfigManager,
        WebServerLinkProvider,
        SocialSharing
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
