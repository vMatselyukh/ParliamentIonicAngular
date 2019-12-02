import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { DbContext, ParliamentApi, ConfigManager, FileManager, WebServerLinkProvider } from '../providers/providers';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule } from '@angular/forms';

import { ProposeQuotePageModule } from './propose-quote/propose-quote.module';
import { ProposeQuotePage } from './propose-quote/propose-quote.page';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { ShareModule } from '@ngx-share/core';

@NgModule({
    declarations: [AppComponent],
    entryComponents: [ProposeQuotePage],
    imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule,
        FormsModule, ProposeQuotePageModule, ShareModule, IonicStorageModule.forRoot()],
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
